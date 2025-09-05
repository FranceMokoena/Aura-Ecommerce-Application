const axios = require('axios');
const crypto = require('crypto');
const Commission = require('../models/Commission');
const Subscription = require('../models/Subscription');
const Payout = require('../models/Payout');
const User = require('../../models/User');

class PaystackService {
  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    this.publicKey = process.env.PAYSTACK_PUBLIC_KEY;
    this.baseURL = 'https://api.paystack.co';
    
    // Configure axios for Paystack API
    this.paystackAPI = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Initialize payment for customer
  async initializePayment(paymentData) {
    try {
      console.log('Initializing Paystack payment:', paymentData);
      
      const payload = {
        email: paymentData.customerEmail,
        amount: paymentData.amount * 100, // Convert to kobo
        currency: 'NGN',
        reference: `AURA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        callback_url: `${process.env.FRONTEND_URL}/payment/verify`,
        metadata: {
          customerId: paymentData.customerId,
          sellerId: paymentData.sellerId,
          orderId: paymentData.orderId,
          custom_fields: [
            {
              display_name: "Customer ID",
              variable_name: "customer_id",
              value: paymentData.customerId
            },
            {
              display_name: "Seller ID",
              variable_name: "seller_id", 
              value: paymentData.sellerId
            },
            {
              display_name: "Order ID",
              variable_name: "order_id",
              value: paymentData.orderId
            }
          ]
        }
      };

      const response = await this.paystackAPI.post('/transaction/initialize', payload);
      
      if (response.data.status) {
        console.log('Paystack payment initialized successfully:', response.data.data.reference);
        
        return {
          success: true,
          authorizationUrl: response.data.data.authorization_url,
          reference: response.data.data.reference,
          accessCode: response.data.data.access_code
        };
      } else {
        throw new Error('Failed to initialize payment');
      }
      
    } catch (error) {
      console.error('Paystack payment initialization error:', error.response?.data || error.message);
      throw new Error(`Payment initialization failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Verify payment after customer completes payment
  async verifyPayment(reference) {
    try {
      console.log('Verifying Paystack payment:', reference);
      
      const response = await this.paystackAPI.get(`/transaction/verify/${reference}`);
      
      if (response.data.status && response.data.data.status === 'success') {
        const transactionData = response.data.data;
        
        console.log('Payment verified successfully:', transactionData.reference);
        
        // Create commission record
        const commission = await this.createCommissionRecord(transactionData);
        
        return {
          success: true,
          transaction: transactionData,
          commission: commission
        };
      } else {
        throw new Error('Payment verification failed');
      }
      
    } catch (error) {
      console.error('Paystack payment verification error:', error.response?.data || error.message);
      throw new Error(`Payment verification failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Create commission record from verified payment
  async createCommissionRecord(transactionData) {
    try {
      const metadata = transactionData.metadata;
      const customerId = metadata.customer_id;
      const sellerId = metadata.seller_id;
      const orderId = metadata.order_id;
      
      // Calculate commission (10%)
      const totalAmount = transactionData.amount; // Already in kobo
      const commissionAmount = Math.round(totalAmount * 0.10);
      const sellerAmount = totalAmount - commissionAmount;
      
      // Create commission record
      const commission = new Commission({
        paymentId: null, // Will be updated when payment is created
        orderId: orderId,
        transactionId: `AURA_${transactionData.reference}`,
        customerId: customerId,
        sellerId: sellerId,
        totalAmount: totalAmount,
        commissionAmount: commissionAmount,
        sellerAmount: sellerAmount,
        commissionRate: 0.10,
        currency: 'NGN',
        paymentMethod: 'paystack',
        paystackReference: transactionData.reference,
        paystackTransactionId: transactionData.id.toString(),
        status: 'calculated',
        escrowStatus: 'held',
        escrowReleaseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        orderType: 'product', // Default, can be updated
        calculatedAt: new Date(),
        metadata: {
          customerEmail: transactionData.customer.email,
          customerPhone: transactionData.customer.phone || '',
          notes: 'Paystack payment processed'
        }
      });
      
      await commission.save();
      console.log('Commission record created:', commission._id);
      
      return commission;
      
    } catch (error) {
      console.error('Error creating commission record:', error);
      throw new Error('Failed to create commission record');
    }
  }

  // Create Paystack customer for subscription
  async createCustomer(userData) {
    try {
      const payload = {
        email: userData.email,
        first_name: userData.name || userData.businessName || 'AURA',
        phone: userData.phone || '',
        metadata: {
          userId: userData._id.toString(),
          businessName: userData.businessName || ''
        }
      };

      const response = await this.paystackAPI.post('/customer', payload);
      
      if (response.data.status) {
        console.log('Paystack customer created:', response.data.data.customer_code);
        return response.data.data;
      } else {
        throw new Error('Failed to create customer');
      }
      
    } catch (error) {
      console.error('Error creating Paystack customer:', error.response?.data || error.message);
      throw new Error(`Customer creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Create subscription for premium tier
  async createSubscription(customerCode, planCode) {
    try {
      const payload = {
        customer: customerCode,
        plan: planCode,
        start_date: new Date().toISOString()
      };

      const response = await this.paystackAPI.post('/subscription', payload);
      
      if (response.data.status) {
        console.log('Paystack subscription created:', response.data.data.subscription_code);
        return response.data.data;
      } else {
        throw new Error('Failed to create subscription');
      }
      
    } catch (error) {
      console.error('Error creating Paystack subscription:', error.response?.data || error.message);
      throw new Error(`Subscription creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Process payout to seller
  async processPayout(payoutData) {
    try {
      console.log('Processing Paystack payout:', payoutData.amount);
      
      const payload = {
        source: 'balance',
        amount: payoutData.amount,
        recipient: payoutData.recipientCode,
        reason: 'AURA Platform Commission Payout'
      };

      const response = await this.paystackAPI.post('/transfer', payload);
      
      if (response.data.status) {
        console.log('Paystack payout initiated:', response.data.data.transfer_code);
        return response.data.data;
      } else {
        throw new Error('Failed to initiate payout');
      }
      
    } catch (error) {
      console.error('Error processing Paystack payout:', error.response?.data || error.message);
      throw new Error(`Payout failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Verify payout status
  async verifyPayout(transferCode) {
    try {
      const response = await this.paystackAPI.get(`/transfer/${transferCode}`);
      
      if (response.data.status) {
        return response.data.data;
      } else {
        throw new Error('Failed to verify payout');
      }
      
    } catch (error) {
      console.error('Error verifying Paystack payout:', error.response?.data || error.message);
      throw new Error(`Payout verification failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get bank list for recipient setup
  async getBankList() {
    try {
      const response = await this.paystackAPI.get('/bank');
      
      if (response.data.status) {
        return response.data.data;
      } else {
        throw new Error('Failed to get bank list');
      }
      
    } catch (error) {
      console.error('Error getting bank list:', error.response?.data || error.message);
      throw new Error(`Bank list fetch failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Create transfer recipient
  async createTransferRecipient(recipientData) {
    try {
      const payload = {
        type: 'nuban',
        name: recipientData.accountName,
        account_number: recipientData.accountNumber,
        bank_code: recipientData.bankCode,
        currency: 'NGN'
      };

      const response = await this.paystackAPI.post('/transferrecipient', payload);
      
      if (response.data.status) {
        console.log('Transfer recipient created:', response.data.data.recipient_code);
        return response.data.data;
      } else {
        throw new Error('Failed to create transfer recipient');
      }
      
    } catch (error) {
      console.error('Error creating transfer recipient:', error.response?.data || error.message);
      throw new Error(`Recipient creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature) {
    try {
      const hash = crypto
        .createHmac('sha512', this.secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      return hash === signature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  // Handle webhook events
  async handleWebhookEvent(event) {
    try {
      console.log('Processing Paystack webhook event:', event.event);
      
      switch (event.event) {
        case 'charge.success':
          await this.handleSuccessfulCharge(event.data);
          break;
        case 'transfer.success':
          await this.handleSuccessfulTransfer(event.data);
          break;
        case 'subscription.create':
          await this.handleSubscriptionCreated(event.data);
          break;
        case 'subscription.disable':
          await this.handleSubscriptionDisabled(event.data);
          break;
        case 'invoice.create':
          await this.handleInvoiceCreated(event.data);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data);
          break;
        default:
          console.log('Unhandled webhook event:', event.event);
      }
      
    } catch (error) {
      console.error('Error handling webhook event:', error);
      throw error;
    }
  }

  // Handle successful charge
  async handleSuccessfulCharge(chargeData) {
    try {
      console.log('Processing successful charge:', chargeData.reference);
      
      // Find commission record
      const commission = await Commission.findOne({
        paystackReference: chargeData.reference
      });
      
      if (commission) {
        commission.status = 'collected';
        commission.collectedAt = new Date();
        await commission.save();
        
        console.log('Commission marked as collected:', commission._id);
      }
      
    } catch (error) {
      console.error('Error handling successful charge:', error);
      throw error;
    }
  }

  // Handle successful transfer
  async handleSuccessfulTransfer(transferData) {
    try {
      console.log('Processing successful transfer:', transferData.transfer_code);
      
      // Find payout record
      const payout = await Payout.findOne({
        paystackTransferCode: transferData.transfer_code
      });
      
      if (payout) {
        await payout.markSuccess(transferData);
        console.log('Payout marked as successful:', payout._id);
      }
      
    } catch (error) {
      console.error('Error handling successful transfer:', error);
      throw error;
    }
  }

  // Handle subscription created
  async handleSubscriptionCreated(subscriptionData) {
    try {
      console.log('Processing subscription created:', subscriptionData.subscription_code);
      
      // Update subscription record
      const subscription = await Subscription.findOne({
        paystackSubscriptionCode: subscriptionData.subscription_code
      });
      
      if (subscription) {
        subscription.status = 'premium';
        subscription.tier = 'premium';
        subscription.currentPeriodStart = new Date(subscriptionData.created_at);
        subscription.currentPeriodEnd = new Date(subscriptionData.next_payment_date);
        await subscription.save();
        
        console.log('Subscription activated:', subscription._id);
      }
      
    } catch (error) {
      console.error('Error handling subscription created:', error);
      throw error;
    }
  }

  // Handle subscription disabled
  async handleSubscriptionDisabled(subscriptionData) {
    try {
      console.log('Processing subscription disabled:', subscriptionData.subscription_code);
      
      // Update subscription record
      const subscription = await Subscription.findOne({
        paystackSubscriptionCode: subscriptionData.subscription_code
      });
      
      if (subscription) {
        subscription.status = 'cancelled';
        subscription.productLimit = 5; // Back to free tier
        await subscription.save();
        
        console.log('Subscription cancelled:', subscription._id);
      }
      
    } catch (error) {
      console.error('Error handling subscription disabled:', error);
      throw error;
    }
  }

  // Handle invoice created
  async handleInvoiceCreated(invoiceData) {
    try {
      console.log('Processing invoice created:', invoiceData.invoice_code);
      // Handle invoice creation logic
    } catch (error) {
      console.error('Error handling invoice created:', error);
      throw error;
    }
  }

  // Handle payment failed
  async handlePaymentFailed(invoiceData) {
    try {
      console.log('Processing payment failed:', invoiceData.invoice_code);
      
      // Find subscription and update status
      const subscription = await Subscription.findOne({
        paystackSubscriptionCode: invoiceData.subscription
      });
      
      if (subscription) {
        subscription.failedPaymentCount += 1;
        subscription.lastFailedPaymentDate = new Date();
        
        // If multiple failed payments, downgrade to free tier
        if (subscription.failedPaymentCount >= 3) {
          subscription.status = 'cancelled';
          subscription.productLimit = 5;
        }
        
        await subscription.save();
        console.log('Subscription payment failed handled:', subscription._id);
      }
      
    } catch (error) {
      console.error('Error handling payment failed:', error);
      throw error;
    }
  }
}

module.exports = new PaystackService();
