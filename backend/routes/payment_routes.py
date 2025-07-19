# =============================================================================
# PAYMENT ROUTES - TEMPORARILY DISABLED
# =============================================================================
# 
# This file contains the complete Paystack payment integration but is currently
# commented out to prevent syntax errors and allow the app to run without
# payment functionality.
#
# TO RE-ENABLE PAYMENT FEATURES:
# 1. Uncomment this entire file (remove the # at the start of each line)
# 2. Fix any syntax errors (check for missing braces, parentheses, etc.)
# 3. Add Paystack credentials to your .env file:
#    PAYSTACK_SECRET_KEY=sk_test_...
#    PAYSTACK_PUBLIC_KEY=pk_test_...
# 4. Run database migration: python scripts/apply_migrations.py
# 5. Restart the server
#
# The payment system includes:
# - Subscription plans (Free, Basic, Premium, Enterprise)
# - Usage tracking and limits
# - Paystack payment processing
# - Webhook handling
# - Automatic limit enforcement
#
# See docs/payment_api.md for complete documentation
# =============================================================================

"""
# from flask import Blueprint, request, jsonify, current_app
# from services.payment_service import PaymentService
# from services.auth_service import AuthService
# import uuid
# from datetime import datetime
# from typing import Optional

# payment_bp = Blueprint('payment', __name__)

# def get_payment_service() -> Optional[PaymentService]:
#     """Get payment service instance."""
#     if not hasattr(current_app, 'payment_service'):
#         return None
#     return current_app.payment_service

# def get_auth_service() -> Optional[AuthService]:
#     """Get auth service instance."""
#     if not hasattr(current_app, 'auth_service'):
#         return None
#     return current_app.auth_service

# def authenticate_user() -> Optional[str]:
#     """Authenticate user and return user ID."""
#     auth_service = get_auth_service()
#     if not auth_service:
#         return None
    
#     auth_header = request.headers.get('Authorization')
#     if not auth_header or not auth_header.startswith('Bearer '):
#         return None
    
#     token = auth_header.split(' ')[1]
#     user_id, auth_type = auth_service.verify_token(token)
#     return user_id

# @payment_bp.route('/plans', methods=['GET'])
# def get_subscription_plans():
#     """Get all available subscription plans."""
#     payment_service = get_payment_service()
#     if not payment_service:
#         return jsonify({
#             'status': 'error',
#             'message': 'Payment service not configured'
#         }), 500
    
#     result = payment_service.get_subscription_plans()
#     if result['success']:
#         return jsonify({
#             'status': 'success',
#             'plans': result['data']
#         }), 200
#     else:
#         return jsonify({
#             'status': 'error',
#             'message': result['error']
#         }), 500

# @payment_bp.route('/subscription', methods=['GET'])
# def get_user_subscription():
#     """Get current user's subscription."""
#     user_id = authenticate_user()
#     if not user_id:
#         return jsonify({
#             'status': 'error',
#             'message': 'Authentication required'
#         }), 401
    
#     payment_service = get_payment_service()
#     if not payment_service:
#         return jsonify({
#             'status': 'error',
#             'message': 'Payment service not configured'
#         }), 500
    
#     subscription = payment_service.get_user_subscription(user_id)
#     return jsonify({
#         'status': 'success',
#         'subscription': subscription
#     }), 200

# @payment_bp.route('/usage', methods=['GET'])
# def get_user_usage():
#     """Get current user's usage summary."""
#     user_id = authenticate_user()
#     if not user_id:
#         return jsonify({
#             'status': 'error',
#             'message': 'Authentication required'
#         }), 401
    
#     payment_service = get_payment_service()
#     if not payment_service:
#         return jsonify({
#             'status': 'error',
#             'message': 'Payment service not configured'
#         }), 500
    
#     result = payment_service.get_user_usage_summary(user_id)
#     if result['success']:
#         return jsonify({
#             'status': 'success',
#             'usage': result['data']
#         }), 200
#     else:
#         return jsonify({
#             'status': 'error',
#             'message': result['error']
#         }), 500

# @payment_bp.route('/check-usage/<feature_name>', methods=['GET'])
# def check_feature_usage(feature_name):
#     """Check if user can use a specific feature."""
#     user_id = authenticate_user()
#     if not user_id:
#         return jsonify({
#             'status': 'error',
#             'message': 'Authentication required'
#         }), 401
    
#     payment_service = get_payment_service()
#     if not payment_service:
#         return jsonify({
#             'status': 'error',
#             'message': 'Payment service not configured'
#         }), 500
    
#     usage_check = payment_service.can_use_feature(user_id, feature_name)
#     return jsonify({
#         'status': 'success',
#         'can_use': usage_check.get('can_use', False),
#         'current_usage': usage_check.get('current_usage', 0),
#         'limit': usage_check.get('limit', 0),
#         'remaining': usage_check.get('remaining', 0),
#         'message': usage_check.get('message', '')
#     }), 200

# @payment_bp.route('/record-usage/<feature_name>', methods=['POST'])
# def record_feature_usage(feature_name):
#     """Record usage of a feature."""
#     user_id = authenticate_user()
#     if not user_id:
#         return jsonify({
#             'status': 'error',
#             'message': 'Authentication required'
#         }), 401
    
#     payment_service = get_payment_service()
#     if not payment_service:
#         return jsonify({
#             'status': 'error',
#             'message': 'Payment service not configured'
#         }), 500
    
#     # Check if user can use the feature
#     usage_check = payment_service.can_use_feature(user_id, feature_name)
#     if not usage_check.get('can_use', False):
#         return jsonify({
#             'status': 'error',
#             'message': usage_check.get('message', 'Usage limit exceeded'),
#             'current_usage': usage_check.get('current_usage', 0),
#             'limit': usage_check.get('limit', 0)
#         }), 403
    
#     # Record the usage
#     data = request.get_json() or {}
#     count = data.get('count', 1)
    
#     success = payment_service.record_usage(user_id, feature_name, count)
#     if success:
#         return jsonify({
#             'status': 'success',
#             'message': 'Usage recorded successfully'
#         }), 200
#     else:
#         return jsonify({
#             'status': 'error',
#             'message': 'Failed to record usage'
#         }), 500

# @payment_bp.route('/initialize-payment', methods=['POST'])
# def initialize_payment():
#     """Initialize a Paystack payment."""
#     user_id = authenticate_user()
#     if not user_id:
#         return jsonify({
#             'status': 'error',
#             'message': 'Authentication required'
#         }), 401
    
#     payment_service = get_payment_service()
#     if not payment_service:
#         return jsonify({
#             'status': 'error',
#             'message': 'Payment service not configured'
#         }), 500
    
#     data = request.get_json()
#     if not data:
#         return jsonify({
#             'status': 'error',
#             'message': 'Request data required'
#         }), 400
    
#     email = data.get('email')
#     amount = data.get('amount')  # Amount in naira
#     plan_id = data.get('plan_id')
#     callback_url = data.get('callback_url')
    
#     if not all([email, amount, plan_id]):
#         return jsonify({
#             'status': 'error',
#             'message': 'Email, amount, and plan_id are required'
#         }), 400
    
#     # Generate unique reference
#     reference = f"ML_{user_id}_{uuid.uuid4().hex[:8]}"
    
#     # Convert amount to kobo (Paystack uses smallest currency unit)
#     amount_kobo = int(amount * 100)
    
#     # Initialize transaction
#     result = payment_service.initialize_transaction(
#         email=email,
#         amount=amount_kobo,
#         reference=reference,
#         callback_url=callback_url,
#         metadata={
#             'user_id': user_id,
#             'plan_id': plan_id,
#             'amount_ngn': amount
#         }
#     )
    
#     if result.get('status'):
#         # Save transaction record
#         transaction_data = {
#             'id': result['data']['id'],
#             'reference': reference,
#             'amount': amount_kobo,
#             'currency': 'NGN',
#             'status': 'pending',
#             'description': f'Subscription payment for plan {plan_id}'
#         }
        
#         payment_service.save_payment_transaction(user_id, transaction_data)
        
#         return jsonify({
#             'status': 'success',
#             'data': {
#                 'authorization_url': result['data']['authorization_url'],
#                 'reference': reference,
#                 'access_code': result['data']['access_code']
#             }
#         }), 200
#     else:
#         return jsonify({
#             'status': 'error',
#             'message': result.get('message', 'Failed to initialize payment')
#         }), 500

# @payment_bp.route('/verify-payment/<reference>', methods=['GET'])
# def verify_payment(reference):
#     """Verify a payment transaction."""
#     user_id = authenticate_user()
#     if not user_id:
#         return jsonify({
#             'status': 'error',
#             'message': 'Authentication required'
#         }), 401
    
#     payment_service = get_payment_service()
#     if not payment_service:
#         return jsonify({
#             'status': 'error',
#             'message': 'Payment service not configured'
#         }), 500
    
#     # Verify with Paystack
#     result = payment_service.verify_transaction(reference)
    
#     if result.get('status') and result['data']['status'] == 'success':
#         # Update transaction status
#         payment_service.save_payment_transaction(user_id, result['data'])
        
#         # Get metadata to determine plan
#         metadata = result['data'].get('metadata', {})
#         plan_id = metadata.get('plan_id')
        
#         if plan_id:
#             # Create or update user subscription
#             subscription_result = payment_service.create_user_subscription(
#                 user_id=user_id,
#                 plan_id=plan_id,
#                 paystack_data={
#                     'transaction_id': result['data']['id'],
#                     'reference': reference
#                 }
#             )
            
#             if subscription_result['success']:
#                 return jsonify({
#                     'status': 'success',
#                     'message': 'Payment verified and subscription activated',
#                     'subscription': subscription_result['data']
#                 }), 200
#             else:
#                 return jsonify({
#                     'status': 'error',
#                     'message': 'Payment verified but failed to activate subscription'
#                 }), 500
        
#         return jsonify({
#             'status': 'success',
#             'message': 'Payment verified successfully'
#         }), 200
#     else:
#         return jsonify({
#             'status': 'error',
#             'message': 'Payment verification failed'
#         }), 400

# @payment_bp.route('/webhook', methods=['POST'])
# def paystack_webhook():
#     """Handle Paystack webhook events."""
#     payment_service = get_payment_service()
#     if not payment_service:
#         return jsonify({
#             'status': 'error',
#             'message': 'Payment service not configured'
#         }), 500
    
#     # Get webhook signature
#     signature = request.headers.get('X-Paystack-Signature')
#     if not signature:
#         return jsonify({
#             'status': 'error',
#             'message': 'Missing webhook signature'
#         }), 400
    
#     # Verify signature
#     payload = request.get_data(as_text=True)
#     if not payment_service.verify_webhook_signature(payload, signature):
#         return jsonify({
#             'status': 'error',
#             'message': 'Invalid webhook signature'
#         }), 400
    
#     # Process webhook
#     try:
#         event_data = request.get_json()
#         result = payment_service.process_webhook(event_data)
        
#         if result['success']:
#             return jsonify({'status': 'success'}), 200
#         else:
#             return jsonify({
#                 'status': 'error',
#                 'message': result['error']
#             }), 500
#     except Exception as e:
#         return jsonify({
#             'status': 'error',
#             'message': str(e)
#         }), 500

# @payment_bp.route('/cancel-subscription', methods=['POST'])
# def cancel_subscription():
#     """Cancel user's subscription."""
#     user_id = authenticate_user()
#     if not user_id:
#         return jsonify({
#             'status': 'error',
#             'message': 'Authentication required'
#         }), 401
    
#     payment_service = get_payment_service()
#     if not payment_service:
#         return jsonify({
#             'status': 'error',
#             'message': 'Payment service not configured'
#         }), 500
    
#     try:
#         # Update subscription to cancel at period end
#         result = current_app.supabase_service.supabase.table('user_subscriptions').update({
#             'cancel_at_period_end': True,
#             'updated_at': datetime.now().isoformat()
#         }).eq('user_id', user_id).eq('status', 'active').execute()
        
#         if result.data:
#             return jsonify({
#                 'status': 'success',
#                 'message': 'Subscription will be cancelled at the end of the current period'
#             }), 200
#         else:
#             return jsonify({
#                 'status': 'error',
#                 'message': 'No active subscription found'
#             }), 404
#     except Exception as e:
#         return jsonify({
#             'status': 'error',
#             'message': str(e)
#         }), 500

# @payment_bp.route('/upgrade-subscription', methods=['POST'])
# def upgrade_subscription():
#     """Upgrade user's subscription."""
#     user_id = authenticate_user()
#     if not user_id:
#         return jsonify({
#             'status': 'error',
#             'message': 'Authentication required'
#         }), 401
    
#     data = request.get_json()
#     if not data or 'plan_id' not in data:
#         return jsonify({
#             'status': 'error',
#             'message': 'Plan ID is required'
#         }), 400
    
#     plan_id = data['plan_id']
    
#     try:
#         # Get plan details
#         plan_result = current_app.supabase_service.supabase.table('subscription_plans').select('*').eq('id', plan_id).single().execute()
#         if not plan_result.data:
#             return jsonify({
#                 'status': 'error',
#                 'message': 'Plan not found'
#             }), 404
        
#         plan = plan_result.data
        
#         # Create new subscription
#         payment_service = get_payment_service()
#         if payment_service:
#             subscription_result = payment_service.create_user_subscription(
#                 user_id=user_id,
#                 plan_id=plan_id
#             )
            
#             if subscription_result['success']:
#                 return jsonify({
#                     'status': 'success',
#                     'message': 'Subscription upgraded successfully',
#                     'plan': plan
#                 }), 200
#             else:
#                 return jsonify({
#                     'status': 'error',
#                     'message': subscription_result['error']
#                 }), 500
        
#         return jsonify({
#             'status': 'error',
#             'message': 'Payment service not available'
#         }), 500
# """

# Create a dummy blueprint to prevent import errors
from flask import Blueprint
payment_bp = Blueprint('payment', __name__)

@payment_bp.route('/status', methods=['GET'])
def payment_status():
    """Payment system status endpoint."""
    return {
        'status': 'disabled',
        'message': 'Payment system is currently disabled. See file comments for re-enabling instructions.',
        'available_features': [
            'Subscription plans (Free, Basic, Premium, Enterprise)',
            'Usage tracking and limits',
            'Paystack payment processing',
            'Webhook handling',
            'Automatic limit enforcement'
        ]
    }, 200 