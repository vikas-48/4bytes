import { db } from '../db/db';

export const SCORE_MIN = 300;
export const SCORE_MAX = 900;
export const SCORE_DEFAULT = 600;
export const SCORE_MAX_CHANGE = 50;

export interface KhataExplanation {
    score: number;
    limit: number;
    availableCredit: number;
    reasons: string[];
    components: {
        pts: number;
        cs: number;
        ors: number;
        rs: number;
    };
}

/**
 * Calculates the Khata Limit based on the Khata Score.
 * @param score Khata Score (300-900)
 */
export const calculateKhataLimit = (score: number): number => {
    if (score >= 800) return 10000;
    if (score >= 700) return 6000;
    if (score >= 600) return 3000;
    if (score >= 500) return 1000;
    return 0;
};

/**
 * Core logic for Khata Score calculation.
 */
export const recalculateKhataScore = async (customerPhone: string): Promise<number> => {
    const customer = await db.customers.where('phoneNumber').equals(customerPhone).first();
    if (!customer) return SCORE_DEFAULT;

    const ledgerEntries = await db.ledger
        .where('customerId').equals(customerPhone)
        .and(entry => entry.paymentMode === 'KHATA')
        .toArray();

    // Guardrail: If KHATA transactions < 1 → score = 600
    if (ledgerEntries.length < 1) {
        console.log(`[KhataLogic] Insufficient data for ${customerPhone}. Defaulting to ${SCORE_DEFAULT}`);
        return SCORE_DEFAULT;
    }

    // 1️⃣ Payment Timeliness Score (PTS) — 40%
    let ptsSum = 0;
    ledgerEntries.forEach(entry => {
        if (entry.status === 'PAID' && entry.paidAt) {
            const daysToPay = (entry.paidAt - entry.createdAt) / (1000 * 60 * 60 * 24);
            if (daysToPay <= 7) ptsSum += 1.0;
            else if (daysToPay <= 15) ptsSum += 0.8;
            else if (daysToPay <= 30) ptsSum += 0.5;
            else ptsSum += 0.2;
        } else {
            // Still unpaid
            ptsSum += 0.0;
        }
    });
    const PTS = ptsSum / ledgerEntries.length;

    // 2️⃣ Consistency Score (CS) — 25%
    const latePayments = ledgerEntries.filter(entry => {
        if (entry.status === 'PAID' && entry.paidAt) {
            const daysToPay = (entry.paidAt - entry.createdAt) / (1000 * 60 * 60 * 24);
            return daysToPay > 15;
        }
        // Unpaid entries are not counted as "late" yet in the CS formula provided
        // but often they are. The formula says: CS = 1 - (latePayments / totalKhataTransactions)
        // where latePayment = payment after 15 days.
        return false;
    }).length;
    const CS = 1 - (latePayments / ledgerEntries.length);

    // 3️⃣ Outstanding Risk Score (ORS) — 20%
    const currentUnpaid = customer.activeKhataAmount || 0;
    const maxHistorical = customer.maxHistoricalKhataAmount || 1; // avoid div by zero
    let ORS = 1 - (currentUnpaid / maxHistorical);
    ORS = Math.max(0, Math.min(1, ORS));

    // 4️⃣ Recency Score (RS) — 15%
    let RS = 0;
    if (customer.lastPaymentDate) {
        const daysSinceLastPayment = (Date.now() - customer.lastPaymentDate) / (1000 * 60 * 60 * 24);
        if (daysSinceLastPayment <= 15) RS = 1.0;
        else if (daysSinceLastPayment <= 30) RS = 0.7;
        else RS = 0.4;
    } else {
        RS = 0.0;
    }

    // Final Score S
    const S = (0.4 * PTS) + (0.25 * CS) + (0.2 * ORS) + (0.15 * RS);
    console.log(`[KhataLogic] Components for ${customerPhone}: PTS=${PTS}, CS=${CS}, ORS=${ORS}, RS=${RS} | S=${S}`);

    let newScore = 300 + (S * 600);
    newScore = Math.max(SCORE_MIN, Math.min(SCORE_MAX, Math.round(newScore)));

    // Smoothing: Max score change per recalculation = ±100 (Increased from 50 for better demo feedback)
    const SCORE_MAX_CHANGE_ADAPTIVE = 100;
    const oldScore = customer.khataScore || SCORE_DEFAULT;
    const diff = newScore - oldScore;
    if (Math.abs(diff) > SCORE_MAX_CHANGE_ADAPTIVE) {
        newScore = oldScore + (diff > 0 ? SCORE_MAX_CHANGE_ADAPTIVE : -SCORE_MAX_CHANGE_ADAPTIVE);
    }

    // Update customer in DB
    await db.customers.update(customer.id!, {
        khataScore: newScore,
        khataLimit: calculateKhataLimit(newScore),
        lastScoreUpdate: Date.now()
    });

    return newScore;
};

/**
 * Gets explainability and status for the UI.
 */
export const getKhataStatus = async (customerPhone: string): Promise<KhataExplanation | null> => {
    const customer = await db.customers.where('phoneNumber').equals(customerPhone).first();
    if (!customer) return null;

    const reasons: string[] = [];

    // Add logic-based reasons
    const score = customer.khataScore || 0;
    if (score < 500) {
        reasons.push("Score is low due to multiple delayed payments or high outstanding dues.");
    } else if (score < 700) {
        reasons.push("Good score, but can improve by paying faster (within 7 days).");
    } else {
        reasons.push("Excellent creditworthiness based on consistent on-time payments.");
    }

    const ledgerEntries = await db.ledger.where('customerId').equals(customerPhone).toArray();
    const unpaidCount = ledgerEntries.filter(e => e.paymentMode === 'KHATA' && e.status === 'PENDING').length;
    if (unpaidCount > 2) {
        reasons.push(`${unpaidCount} bills currently pending. Clearing these will boost your score.`);
    }

    return {
        score: customer.khataScore || SCORE_DEFAULT,
        limit: customer.khataLimit || 0,
        availableCredit: Math.max(0, (customer.khataLimit || 0) - (customer.activeKhataAmount || 0)),
        reasons,
        components: {
            pts: 0, // Mocked for now as we don't store components individually
            cs: 0,
            ors: 0,
            rs: 0
        }
    };
};
