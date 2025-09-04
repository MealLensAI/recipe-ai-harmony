import os
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from supabase import create_client, Client

class SubscriptionService:
    def __init__(self):
        # Initialize Supabase client
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.paystack_secret_key = os.getenv('PAYSTACK_SECRET_KEY')
        self.paystack_public_key = os.getenv('PAYSTACK_PUBLIC_KEY')
        
    def get_user_subscription_status(self, user_id: str, firebase_uid: str = None) -> Dict[str, Any]:
        """
        Get comprehensive subscription status for a user
        """
        try:
            # Try to get user from Supabase auth first
            if user_id and user_id != 'anon':
                result = self.supabase.rpc(
                    'get_user_subscription_status',
                    {'p_user_id': user_id}
                ).execute()
                
                if result.data:
                    return {
                        'success': True,
                        'data': result.data
                    }
            
            # Fallback to Firebase UID if Supabase user not found
            if firebase_uid:
                # Get user profile by Firebase UID
                profile_result = self.supabase.table('profiles').select('id').eq('firebase_uid', firebase_uid).execute()
                
                if profile_result.data:
                    supabase_user_id = profile_result.data[0]['id']
                    result = self.supabase.rpc(
                        'get_user_subscription_status',
                        {'p_user_id': supabase_user_id}
                    ).execute()
                    
                    if result.data:
                        return {
                            'success': True,
                            'data': result.data
                        }
            
            # Return default status if no user found
            return {
                'success': True,
                'data': {
                    'has_active_subscription': False,
                    'subscription': None,
                    'trial': None,
                    'can_access_app': False
                }
            }
            
        except Exception as e:
            print(f"Error getting subscription status: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'data': {
                    'has_active_subscription': False,
                    'subscription': None,
                    'trial': None,
                    'can_access_app': False
                }
            }
    
    def can_user_use_feature(self, user_id: str, feature_name: str, firebase_uid: str = None) -> Dict[str, Any]:
        """
        Check if user can use a specific feature
        """
        try:
            # Try to get user from Supabase auth first
            if user_id and user_id != 'anon':
                result = self.supabase.rpc(
                    'can_user_use_feature',
                    {'p_user_id': user_id, 'p_feature_name': feature_name}
                ).execute()
                
                if result.data:
                    return {
                        'success': True,
                        'data': result.data
                    }
            
            # Fallback to Firebase UID if Supabase user not found
            if firebase_uid:
                profile_result = self.supabase.table('profiles').select('id').eq('firebase_uid', firebase_uid).execute()
                
                if profile_result.data:
                    supabase_user_id = profile_result.data[0]['id']
                    result = self.supabase.rpc(
                        'can_user_use_feature',
                        {'p_user_id': supabase_user_id, 'p_feature_name': feature_name}
                    ).execute()
                    
                    if result.data:
                        return {
                            'success': True,
                            'data': result.data
                        }
            
            # Return default response if no user found
            return {
                'success': True,
                'data': {
                    'can_use': False,
                    'feature_name': feature_name,
                    'plan_name': 'none',
                    'current_usage': 0,
                    'feature_available': False,
                    'message': 'No active subscription'
                }
            }
            
        except Exception as e:
            print(f"Error checking feature access: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'data': {
                    'can_use': False,
                    'feature_name': feature_name,
                    'plan_name': 'none',
                    'current_usage': 0,
                    'feature_available': False,
                    'message': 'Error checking access'
                }
            }
    
    def record_feature_usage(self, user_id: str, feature_name: str, count: int = 1, firebase_uid: str = None) -> Dict[str, Any]:
        """
        Record feature usage for a user
        """
        try:
            # Try to get user from Supabase auth first
            if user_id and user_id != 'anon':
                result = self.supabase.rpc(
                    'record_feature_usage',
                    {'p_user_id': user_id, 'p_feature_name': feature_name, 'p_count': count}
                ).execute()
                
                if result.data:
                    return {
                        'success': True,
                        'message': 'Feature usage recorded successfully'
                    }
            
            # Fallback to Firebase UID if Supabase user not found
            if firebase_uid:
                profile_result = self.supabase.table('profiles').select('id').eq('firebase_uid', firebase_uid).execute()
                
                if profile_result.data:
                    supabase_user_id = profile_result.data[0]['id']
                    result = self.supabase.rpc(
                        'record_feature_usage',
                        {'p_user_id': supabase_user_id, 'p_feature_name': feature_name, 'p_count': count}
                    ).execute()
                    
                    if result.data:
                        return {
                            'success': True,
                            'message': 'Feature usage recorded successfully'
                        }
            
            return {
                'success': False,
                'error': 'User not found'
            }
            
        except Exception as e:
            print(f"Error recording feature usage: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_user_trial(self, user_id: str, duration_days: int = 7, firebase_uid: str = None) -> Dict[str, Any]:
        """
        Create a trial for a new user
        """
        try:
            # Try to get user from Supabase auth first
            if user_id and user_id != 'anon':
                result = self.supabase.rpc(
                    'create_user_trial',
                    {'p_user_id': user_id, 'p_duration_days': duration_days}
                ).execute()
                
                if result.data:
                    return {
                        'success': True,
                        'message': 'Trial created successfully',
                        'duration_days': duration_days
                    }
            
            # Fallback to Firebase UID if Supabase user not found
            if firebase_uid:
                profile_result = self.supabase.table('profiles').select('id').eq('firebase_uid', firebase_uid).execute()
                
                if profile_result.data:
                    supabase_user_id = profile_result.data[0]['id']
                    result = self.supabase.rpc(
                        'create_user_trial',
                        {'p_user_id': supabase_user_id, 'p_duration_days': duration_days}
                    ).execute()
                    
                    if result.data:
                        return {
                            'success': True,
                            'message': 'Trial created successfully',
                            'duration_days': duration_days
                        }
            
            return {
                'success': False,
                'error': 'User not found'
            }
            
        except Exception as e:
            print(f"Error creating trial: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def activate_subscription(self, user_id: str, plan_name: str, paystack_data: Dict[str, Any], firebase_uid: str = None) -> Dict[str, Any]:
        """
        Activate a subscription for a user after successful payment
        """
        try:
            # Try to get user from Supabase auth first
            if user_id and user_id != 'anon':
                result = self.supabase.rpc(
                    'activate_user_subscription',
                    {'p_user_id': user_id, 'p_plan_name': plan_name, 'p_paystack_data': paystack_data}
                ).execute()
                
                if result.data and result.data.get('success'):
                    return {
                        'success': True,
                        'data': result.data
                    }
            
            # Fallback to Firebase UID if Supabase user not found
            if firebase_uid:
                profile_result = self.supabase.table('profiles').select('id').eq('firebase_uid', firebase_uid).execute()
                
                if profile_result.data:
                    supabase_user_id = profile_result.data[0]['id']
                    result = self.supabase.rpc(
                        'activate_user_subscription',
                        {'p_user_id': supabase_user_id, 'p_plan_name': plan_name, 'p_paystack_data': paystack_data}
                    ).execute()
                    
                    if result.data and result.data.get('success'):
                        return {
                            'success': True,
                            'data': result.data
                        }
            
            return {
                'success': False,
                'error': 'User not found or activation failed'
            }
            
        except Exception as e:
            print(f"Error activating subscription: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def save_payment_transaction(self, user_id: str, paystack_data: Dict[str, Any], firebase_uid: str = None) -> Dict[str, Any]:
        """
        Save payment transaction details
        """
        try:
            # Prepare transaction data
            transaction_data = {
                'user_id': user_id,
                'firebase_uid': firebase_uid,
                'paystack_transaction_id': paystack_data.get('id'),
                'paystack_reference': paystack_data.get('reference'),
                'amount': float(paystack_data.get('amount', 0)) / 100,  # Convert from kobo to naira
                'currency': paystack_data.get('currency', 'NGN'),
                'status': 'success' if paystack_data.get('status') == 'success' else 'pending',
                'payment_method': paystack_data.get('channel'),
                'description': paystack_data.get('description', ''),
                'metadata': paystack_data
            }
            
            # Insert transaction record
            result = self.supabase.table('payment_transactions').insert(transaction_data).execute()
            
            if result.data:
                return {
                    'success': True,
                    'transaction_id': result.data[0]['id'],
                    'message': 'Payment transaction saved successfully'
                }
            
            return {
                'success': False,
                'error': 'Failed to save transaction'
            }
            
        except Exception as e:
            print(f"Error saving payment transaction: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_subscription_plans(self) -> Dict[str, Any]:
        """
        Get all available subscription plans
        """
        try:
            result = self.supabase.table('subscription_plans').select('*').eq('is_active', True).execute()
            
            if result.data:
                return {
                    'success': True,
                    'plans': result.data
                }
            
            return {
                'success': False,
                'error': 'No plans found'
            }
            
        except Exception as e:
            print(f"Error getting subscription plans: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def verify_paystack_payment(self, reference: str) -> Dict[str, Any]:
        """
        Verify payment with Paystack
        """
        try:
            if not self.paystack_secret_key:
                return {
                    'success': False,
                    'error': 'Paystack secret key not configured'
                }
            
            # Verify payment with Paystack
            headers = {
                'Authorization': f'Bearer {self.paystack_secret_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f'https://api.paystack.co/transaction/verify/{reference}',
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('status') and data['data'].get('status') == 'success':
                    return {
                        'success': True,
                        'data': data['data'],
                        'message': 'Payment verified successfully'
                    }
                else:
                    return {
                        'success': False,
                        'error': 'Payment verification failed',
                        'data': data
                    }
            else:
                return {
                    'success': False,
                    'error': f'Paystack API error: {response.status_code}',
                    'data': response.text
                }
                
        except Exception as e:
            print(f"Error verifying Paystack payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def process_paystack_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process Paystack webhook events
        """
        try:
            # Save webhook data
            webhook_record = {
                'event_type': webhook_data.get('event'),
                'paystack_event_id': webhook_data.get('id'),
                'paystack_reference': webhook_data.get('data', {}).get('reference'),
                'event_data': webhook_data,
                'processed': False
            }
            
            result = self.supabase.table('paystack_webhooks').insert(webhook_record).execute()
            
            if not result.data:
                return {
                    'success': False,
                    'error': 'Failed to save webhook data'
                }
            
            webhook_id = result.data[0]['id']
            
            # Process different event types
            event_type = webhook_data.get('event')
            
            if event_type == 'charge.success':
                return self._process_successful_payment(webhook_data, webhook_id)
            elif event_type == 'subscription.create':
                return self._process_subscription_created(webhook_data, webhook_id)
            elif event_type == 'subscription.disable':
                return self._process_subscription_disabled(webhook_data, webhook_id)
            else:
                # Mark as processed for other event types
                self.supabase.table('paystack_webhooks').update({'processed': True}).eq('id', webhook_id).execute()
                return {
                    'success': True,
                    'message': f'Webhook processed: {event_type}'
                }
                
        except Exception as e:
            print(f"Error processing webhook: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _process_successful_payment(self, webhook_data: Dict[str, Any], webhook_id: str) -> Dict[str, Any]:
        """
        Process successful payment webhook
        """
        try:
            data = webhook_data.get('data', {})
            reference = data.get('reference')
            customer_email = data.get('customer', {}).get('email')
            
            # Find user by email
            if customer_email:
                profile_result = self.supabase.table('profiles').select('id, firebase_uid').eq('email', customer_email).execute()
                
                if profile_result.data:
                    user_id = profile_result.data[0]['id']
                    firebase_uid = profile_result.data[0]['firebase_uid']
                    
                    # Save payment transaction
                    transaction_result = self.save_payment_transaction(user_id, data, firebase_uid)
                    
                    # Mark webhook as processed
                    self.supabase.table('paystack_webhooks').update({'processed': True}).eq('id', webhook_id).execute()
                    
                    return {
                        'success': True,
                        'message': 'Payment processed successfully',
                        'transaction': transaction_result
                    }
            
            return {
                'success': False,
                'error': 'User not found for email'
            }
            
        except Exception as e:
            print(f"Error processing successful payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _process_subscription_created(self, webhook_data: Dict[str, Any], webhook_id: str) -> Dict[str, Any]:
        """
        Process subscription created webhook
        """
        try:
            data = webhook_data.get('data', {})
            customer_email = data.get('customer', {}).get('email')
            plan_code = data.get('plan', {}).get('plan_code')
            
            # Map plan code to plan name
            plan_mapping = {
                'PLAN_WEEKLY': 'weekly',
                'PLAN_BIWEEKLY': 'biweekly',
                'PLAN_MONTHLY': 'monthly',
                'PLAN_YEARLY': 'yearly'
            }
            
            plan_name = plan_mapping.get(plan_code, 'monthly')
            
            if customer_email:
                profile_result = self.supabase.table('profiles').select('id, firebase_uid').eq('email', customer_email).execute()
                
                if profile_result.data:
                    user_id = profile_result.data[0]['id']
                    firebase_uid = profile_result.data[0]['firebase_uid']
                    
                    # Activate subscription
                    subscription_result = self.activate_subscription(user_id, plan_name, data, firebase_uid)
                    
                    # Mark webhook as processed
                    self.supabase.table('paystack_webhooks').update({'processed': True}).eq('id', webhook_id).execute()
                    
                    return {
                        'success': True,
                        'message': 'Subscription activated successfully',
                        'subscription': subscription_result
                    }
            
            return {
                'success': False,
                'error': 'User not found for email'
            }
            
        except Exception as e:
            print(f"Error processing subscription created: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _process_subscription_disabled(self, webhook_data: Dict[str, Any], webhook_id: str) -> Dict[str, Any]:
        """
        Process subscription disabled webhook
        """
        try:
            data = webhook_data.get('data', {})
            customer_email = data.get('customer', {}).get('email')
            
            if customer_email:
                profile_result = self.supabase.table('profiles').select('id').eq('email', customer_email).execute()
                
                if profile_result.data:
                    user_id = profile_result.data[0]['id']
                    
                    # Disable subscription
                    self.supabase.table('user_subscriptions').update({
                        'status': 'cancelled',
                        'updated_at': datetime.now().isoformat()
                    }).eq('user_id', user_id).eq('status', 'active').execute()
                    
                    # Mark webhook as processed
                    self.supabase.table('paystack_webhooks').update({'processed': True}).eq('id', webhook_id).execute()
                    
                    return {
                        'success': True,
                        'message': 'Subscription disabled successfully'
                    }
            
            return {
                'success': False,
                'error': 'User not found for email'
            }
            
        except Exception as e:
            print(f"Error processing subscription disabled: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_user_usage_stats(self, user_id: str, firebase_uid: str = None) -> Dict[str, Any]:
        """
        Get usage statistics for a user
        """
        try:
            # Try to get user from Supabase auth first
            if user_id and user_id != 'anon':
                result = self.supabase.table('feature_usage').select('*').eq('user_id', user_id).execute()
                
                if result.data:
                    return {
                        'success': True,
                        'usage_stats': result.data
                    }
            
            # Fallback to Firebase UID if Supabase user not found
            if firebase_uid:
                profile_result = self.supabase.table('profiles').select('id').eq('firebase_uid', firebase_uid).execute()
                
                if profile_result.data:
                    supabase_user_id = profile_result.data[0]['id']
                    result = self.supabase.table('feature_usage').select('*').eq('user_id', supabase_user_id).execute()
                    
                    if result.data:
                        return {
                            'success': True,
                            'usage_stats': result.data
                        }
            
            return {
                'success': True,
                'usage_stats': []
            }
            
        except Exception as e:
            print(f"Error getting usage stats: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'usage_stats': []
            }


