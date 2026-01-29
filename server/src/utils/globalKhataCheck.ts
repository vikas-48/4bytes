import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import { Customer } from '../models/Customer.js';
import { CustomerAccount } from '../models/CustomerAccount.js';
import { User } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Usage: npx tsx src/utils/globalKhataCheck.ts <phoneNumber>
const phoneNumber = process.argv[2] || '9876543210';

async function checkGlobalKhata() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!, { family: 4 });
        console.log(`\n🔍 Searching for Global Customer: ${phoneNumber}...`);

        const customer = await Customer.findOne({ phoneNumber });
        if (!customer) {
            console.log('❌ Customer not found globally.');
            process.exit(0);
        }

        console.log(`✅ Found Customer: ${customer.name} (ID: ${customer._id})`);
        console.log('--------------------------------------------------');

        // Query ALL accounts across ALL shops for this customer
        const accounts = await CustomerAccount.find({ customerId: customer._id }).populate('shopkeeperId');

        if (accounts.length === 0) {
            console.log('ℹ️  No Khata accounts found for this customer at any shop.');
        } else {
            console.log(`📊 Found Khata records across ${accounts.length} store(s):\n`);

            let totalLiability = 0;

            accounts.forEach((acc: any) => {
                const shopkeeper = acc.shopkeeperId;
                const shopName = shopkeeper ? (shopkeeper.name || shopkeeper.email) : 'Unknown Shop';

                console.log(`🏪 Store: ${shopName}`);
                console.log(`   Balance Due: ₹${acc.balance}`);
                console.log(`   Account ID: ${acc._id}`);
                console.log('   - - -');

                totalLiability += acc.balance;
            });

            console.log('--------------------------------------------------');
            console.log(`💰 Total Liability across Database: ₹${totalLiability}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkGlobalKhata();
