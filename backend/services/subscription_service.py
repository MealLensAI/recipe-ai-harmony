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
        
    def get_user_subscription_status(self, user_id: str) -> Dict[str, Any]:
        """
        Get comprehensive subscription status for a user
        """
        try:
            supabase_user_id = None
            
            # Use provided user_id directly (we're using Supabase auth, not Firebase)
            if user_id and user_id != 'anon':
                supabase_user_id = user_id
                print(f"✅ Using provided user ID: {supabase_user_id}")
            # Supabase-only implementation; no Firebase UID fallback
            
            if not supabase_user_id:
                return {
                    'success': True,
                    'data': {
                        'has_active_subscription': False,
                        'subscription': None,
                        'trial': None,
                        'can_access_app': False
                    }
                }
            
            # Get active subscription directly from table
            print(f"🔍 Looking for subscriptions for user ID: {supabase_user_id}")
            subscription_result = self.supabase.table('user_subscriptions').select(
                'id, plan_id, status, current_period_start, current_period_end, created_at, updated_at'
            ).eq('user_id', supabase_user_id).eq('status', 'active').execute()
            print(f"🔍 Subscription query result: {subscription_result.data}")
            
            subscription = None
            has_active_subscription = False
            
            if subscription_result.data:
                # Check if subscription is still active (not expired)
                from datetime import datetime, timezone
                now = datetime.now(timezone.utc)
                
                for sub in subscription_result.data:
                    end_date_str = sub.get('current_period_end')
                    if end_date_str:
                        end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                        if end_date > now:
                            subscription = {
                                'id': sub['id'],
                                'plan_id': sub['plan_id'],
                                'plan_name': 'Unknown',  # We'll get this separately if needed
                                'status': sub['status'],
                                'start_date': sub['current_period_start'],
                                'end_date': sub['current_period_end'],
                                'created_at': sub['created_at'],
                                'updated_at': sub['updated_at']
                            }
                            has_active_subscription = True
                            break
            
            # Get trial info
            trial_result = self.supabase.table('user_trials').select('*').eq('user_id', supabase_user_id).order('created_at', desc=True).limit(1).execute()
            
            trial = None
            trial_active = False
            if trial_result.data:
                trial_data = trial_result.data[0]
                trial = {
                    'id': trial_data['id'],
                    'start_date': trial_data['start_date'],
                    'end_date': trial_data['end_date'],
                    'is_used': trial_data['is_used'],
                    'created_at': trial_data['created_at']
                }
                # Determine trial active
                try:
                    from datetime import datetime, timezone
                    if trial_data.get('end_date'):
                        trial_end = datetime.fromisoformat(str(trial_data['end_date']).replace('Z', '+00:00'))
                        now_dt = datetime.now(timezone.utc)
                        trial_active = trial_end > now_dt
                except Exception:
                    trial_active = False
            
            # Determine if user can access app (subscription OR active trial)
            can_access_app = has_active_subscription or trial_active
            
            return {
                'success': True,
                'data': {
                    'has_active_subscription': has_active_subscription,
                    'subscription': subscription,
                    'trial': trial,
                    'can_access_app': can_access_app
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
    
    def can_user_use_feature(self, user_id: str, feature_name: str) -> Dict[str, Any]:
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
            
            # No Firebase fallback
            
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
    
    def record_feature_usage(self, user_id: str, feature_name: str, count: int = 1) -> Dict[str, Any]:
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
            
            # No Firebase fallback
            
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
    
    def create_user_trial(self, user_id: str, duration_days: int = 7) -> Dict[str, Any]:
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
            
            # No Firebase fallback
            
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
    
    def activate_subscription(self, user_id: str, plan_name: str, paystack_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Activate a subscription for a user and mark trial as used
        """
        try:
            # Get the plan details
            plan_result = self.supabase.table('subscription_plans').select('*').eq('name', plan_name).execute()
            if not plan_result.data:
                return {
                    'success': False,
                    'error': f'Plan {plan_name} not found'
                }
            
            plan = plan_result.data[0]
            duration_days = plan.get('duration_days', 30)
            
            # Calculate subscription end date
            start_date = datetime.now()
            end_date = start_date + timedelta(days=duration_days)
            
            # Try to get user from Supabase auth first
            supabase_user_id = user_id if user_id and user_id != 'anon' else None
            
            if not supabase_user_id:
                return {
                    'success': False,
                    'error': 'User not found'
                }
            
            # Create subscription record
            subscription_data = {
                'user_id': supabase_user_id,
                'plan_id': plan['id'],
                'status': 'active',
                'current_period_start': start_date.isoformat(),
                'current_period_end': end_date.isoformat(),
            }
            
            subscription_result = self.supabase.table('user_subscriptions').insert(subscription_data).execute()
            
            if not subscription_result.data:
                return {
                    'success': False,
                    'error': 'Failed to create subscription record'
                }
            
            # Mark trial as used (if exists)
            trial_result = self.supabase.table('user_trials').update({
                'is_used': True,
                'updated_at': datetime.now().isoformat()
            }).eq('user_id', supabase_user_id).execute()
            
            # Create payment transaction record
            payment_data = {
                'user_id': supabase_user_id,
                'subscription_id': subscription_result.data[0]['id'],
                'plan_id': plan['id'],
                'amount': plan.get('price_usd', 0),
                'currency': 'USD',
                'payment_method': 'paystack',
                'status': 'completed',
                'paystack_reference': paystack_data.get('reference', ''),
                'paystack_transaction_id': paystack_data.get('transaction_id', ''),
                'metadata': paystack_data
            }
            
            payment_result = self.supabase.table('payment_transactions').insert(payment_data).execute()
            
            return {
                'success': True,
                'data': {
                    'subscription_id': subscription_result.data[0]['id'],
                    'plan_name': plan_name,
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'duration_days': duration_days,
                    'trial_marked_used': len(trial_result.data) > 0 if trial_result.data else False
                }
            }
            
        except Exception as e:
            print(f"Error activating subscription: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def activate_subscription_for_days(self, user_id: str, duration_days: int, paystack_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Activate a subscription for a specific number of days and mark trial as used
        """
        try:
            # Calculate subscription end date
            start_date = datetime.now()
            end_date = start_date + timedelta(days=duration_days)
            
            # Use provided user_id (Supabase auth)
            supabase_user_id = user_id if user_id and user_id != 'anon' and user_id != 'anonymous' else None
            
            if not supabase_user_id:
                return {
                    'success': False,
                    'error': 'User not found - invalid user ID'
                }
            
            # Check if user has a profile, if not create one
            profile_result = self.supabase.table('profiles').select('*').eq('id', supabase_user_id).execute()
            if not profile_result.data:
                print(f"🔍 User {supabase_user_id} doesn't have a profile, creating one...")
                # Create a basic profile for the user
                profile_data = {
                    'id': supabase_user_id,
                    'email': paystack_data.get('email', 'unknown@example.com'),
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }
                try:
                    profile_create_result = self.supabase.table('profiles').insert(profile_data).execute()
                    if not profile_create_result.data:
                        print(f"⚠️ Failed to create profile for user {supabase_user_id}")
                        print(f"⚠️ Profile creation error: {profile_create_result}")
                    else:
                        print(f"✅ Created profile for user {supabase_user_id}")
                except Exception as e:
                    print(f"⚠️ Exception creating profile for user {supabase_user_id}: {e}")
            else:
                print(f"✅ User {supabase_user_id} already has a profile")
            
            # Get or create a default plan for custom duration
            plan_result = self.supabase.table('subscription_plans').select('*').eq('duration_days', duration_days).execute()
            if not plan_result.data:
                # Create a temporary plan for this duration
                plan_data = {
                    'name': f'custom_{duration_days}_days',
                    'display_name': f'{duration_days} Days',
                    'price_usd': 0,  # Will be updated with actual payment amount
                    'duration_days': duration_days,
                    'features': ['Full app access'],
                    'is_active': True
                }
                plan_result = self.supabase.table('subscription_plans').insert(plan_data).execute()
            
            plan = plan_result.data[0]
            
            # Create subscription record
            subscription_data = {
                'user_id': supabase_user_id,
                'plan_id': plan['id'],
                'status': 'active',
                'current_period_start': start_date.isoformat(),
                'current_period_end': end_date.isoformat(),
            }
            
            subscription_result = self.supabase.table('user_subscriptions').insert(subscription_data).execute()
            
            if not subscription_result.data:
                return {
                    'success': False,
                    'error': 'Failed to create subscription record'
                }
            
            # Mark trial as used (if exists)
            trial_result = self.supabase.table('user_trials').update({
                'is_used': True,
                'updated_at': datetime.now().isoformat()
            }).eq('user_id', supabase_user_id).execute()
            
            # Create payment transaction record
            payment_data = {
                'user_id': supabase_user_id,
                'subscription_id': subscription_result.data[0]['id'],
                'plan_id': plan['id'],
                'amount': paystack_data.get('amount', 0),
                'currency': 'USD',
                'payment_method': 'paystack',
                'status': 'completed',
                'paystack_reference': paystack_data.get('reference', ''),
                'paystack_transaction_id': paystack_data.get('transaction_id', paystack_data.get('reference', 'unknown')),
                'metadata': paystack_data
            }
            
            payment_result = self.supabase.table('payment_transactions').insert(payment_data).execute()
            
            return {
                'success': True,
                'data': {
                    'subscription_id': subscription_result.data[0]['id'],
                    'plan_name': plan['name'],
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'duration_days': duration_days,
                    'trial_marked_used': len(trial_result.data) > 0 if trial_result.data else False
                }
            }
            
        except Exception as e:
            print(f"Error activating subscription for days: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def save_payment_transaction(self, user_id: str, paystack_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Save payment transaction details
        """
        try:
            # Prepare transaction data
            transaction_data = {
                'user_id': user_id,
                'paystack_transaction_id': paystack_data.get('transaction_id', paystack_data.get('id')),
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
                profile_result = self.supabase.table('profiles').select('id').eq('email', customer_email).execute()
                
                if profile_result.data:
                    user_id = profile_result.data[0]['id']
                    
                    # Save payment transaction
                    transaction_result = self.save_payment_transaction(user_id, data)
                    
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
                profile_result = self.supabase.table('profiles').select('id').eq('email', customer_email).execute()
                
                if profile_result.data:
                    user_id = profile_result.data[0]['id']
                    
                    # Activate subscription
                    subscription_result = self.activate_subscription(user_id, plan_name, data)
                    
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
    
    def get_user_usage_stats(self, user_id: str) -> Dict[str, Any]:
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
            
            # No Supabase user found - return empty stats
            
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


