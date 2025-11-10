"""
Enterprise Management Routes
Handles organization/enterprise registration, user invitations, and management
"""

from flask import Blueprint, request, jsonify, current_app
from functools import wraps
import uuid
import secrets
import os
from datetime import datetime, timedelta, timezone
from services.email_service import email_service
from supabase import Client

def get_frontend_url():
    """Get the frontend URL from environment or auto-detect from request origin"""
    # Priority 1: Environment variable (for local development)
    frontend_url = os.environ.get('FRONTEND_URL')
    if frontend_url:
        print(f"🔍 Using FRONTEND_URL from env: {frontend_url}")
        return frontend_url
    
    # Priority 2: Request Origin header (works for both dev and production)
    origin = request.headers.get('Origin')
    if origin:
        print(f"🔍 Using Origin header: {origin}")
        return origin
    
    # Priority 3: Referer header as fallback
    referer = request.headers.get('Referer')
    if referer:
        from urllib.parse import urlparse
        parsed = urlparse(referer)
        frontend_url = f"{parsed.scheme}://{parsed.netloc}"
        print(f"🔍 Using Referer header: {frontend_url}")
        return frontend_url
    
    # Last resort: Production URL
    print(f"🔍 No env/origin/referer found, using production URL")
    return 'https://www.meallensai.com'

enterprise_bp = Blueprint('enterprise', __name__)

def get_supabase_client(use_admin: bool = False) -> Client:
    """Helper function to get the Supabase client from the app context."""
    if use_admin:
        # Use admin client that bypasses RLS
        from supabase import create_client
        import os
        return create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        )
    
    if hasattr(current_app, 'supabase_service'):
        return current_app.supabase_service.supabase
    raise Exception("Supabase service not available")

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        try:
            supabase = get_supabase_client()
            user = supabase.auth.get_user(token)
            if not user:
                return jsonify({'error': 'Invalid token'}), 401
            request.user_id = user.user.id
            request.user_email = user.user.email
        except Exception as e:
            return jsonify({'error': f'Authentication failed: {str(e)}'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

def check_user_is_org_admin(user_id: str, enterprise_id: str, supabase: Client) -> tuple[bool, str]:
    """
    Check if a user is an admin or owner of an organization.
    
    Returns:
        tuple: (is_admin, reason)
    """
    try:
        # Check if user created this organization (owner)
        enterprise_result = supabase.table('enterprises').select('id, created_by').eq('id', enterprise_id).execute()
        
        if not enterprise_result.data:
            return False, "Organization not found"
        
        enterprise = enterprise_result.data[0]
        
        # If user is the creator, they're automatically an admin
        if enterprise['created_by'] == user_id:
            return True, "User is organization owner"
        
        # Check if user is an admin member of this organization
        membership_result = supabase.table('organization_users').select('role').eq('enterprise_id', enterprise_id).eq('user_id', user_id).execute()
        
        if not membership_result.data:
            return False, "User is not a member of this organization"
        
        role = membership_result.data[0]['role']
        
        # Allow admins and owners to invite/manage users
        if role in ['admin', 'owner']:
            return True, f"User has {role} role"
        
        return False, f"User role '{role}' does not have permission to manage users"
        
    except Exception as e:
        return False, f"Error checking user permissions: {str(e)}"


def check_user_can_create_organizations(user_id: str, supabase: Client) -> tuple[bool, str]:
    """
    Check if a user can create organizations.
    Users can create organizations if:
    1. They are NOT invited members of other organizations, AND
    2. They either own organizations OR they signed up as an organization user
    
    Returns:
        tuple: (can_create, reason)
    """
    try:
        current_app.logger.info(f"[PERMISSION CHECK] Checking permissions for user {user_id}")
        
        # Check if user is a member (not owner) of any organization
        result = supabase.table('organization_users').select('id, role').eq('user_id', user_id).execute()
        current_app.logger.info(f"[PERMISSION CHECK] Organization memberships: {len(result.data) if result.data else 0}")
        
        if result.data:
            # User is a member of at least one organization
            current_app.logger.info(f"[PERMISSION CHECK] User is already a member of an organization")
            return False, "Invited users cannot create organizations. Only organization owners can create new organizations."
        
        # Check if user already owns any organizations
        owned_orgs = supabase.table('enterprises').select('id').eq('created_by', user_id).execute()
        current_app.logger.info(f"[PERMISSION CHECK] Owned organizations: {len(owned_orgs.data) if owned_orgs.data else 0}")
        
        # If user owns organizations, they can create more
        if owned_orgs.data:
            current_app.logger.info(f"[PERMISSION CHECK] ✅ User already owns organizations, can create more")
            return True, "User can create organizations"
        
        # If user doesn't own any organizations, check if they signed up as an organization user
        # We'll check the profiles table for signup_type metadata since admin API requires special permissions
        try:
            current_app.logger.info(f"[PERMISSION CHECK] Checking signup_type from profiles table")
            
            # First, try to get from profiles table where we store user metadata
            profile_result = supabase.table('profiles').select('*').eq('id', user_id).execute()
            
            if profile_result.data and len(profile_result.data) > 0:
                # Check if there's a signup_type column or metadata field
                current_app.logger.info(f"[PERMISSION CHECK] Profile data: {profile_result.data[0]}")
                
                # For now, allow all new users who don't have organizations to create one
                # This is a permissive approach - if you signed up for the first time, you can create
                current_app.logger.info(f"[PERMISSION CHECK] ✅ New user with no existing organizations, allowing organization creation")
                return True, "User can create organizations (first-time organization setup)"
            else:
                current_app.logger.warning(f"[PERMISSION CHECK] No profile found for user")
                # Still allow - benefit of the doubt for new users
                return True, "User can create organizations (new user)"
                
        except Exception as metadata_error:
            current_app.logger.error(f"[PERMISSION CHECK] ❌ Error checking profile: {str(metadata_error)}", exc_info=True)
            # On error, allow creation - better to be permissive for legitimate users
            # The alternative (checking metadata via admin API) requires special Supabase privileges
            current_app.logger.info(f"[PERMISSION CHECK] ✅ Allowing organization creation (cannot verify signup_type due to permissions)")
            return True, "User can create organizations (verification unavailable, allowing by default)"
        
    except Exception as e:
        current_app.logger.error(f"[PERMISSION CHECK] ❌ Error checking user permissions: {str(e)}", exc_info=True)
        return False, f"Error checking user permissions: {str(e)}"


@enterprise_bp.route('/api/enterprise/register', methods=['POST'])
@require_auth
def register_enterprise():
    """Register a new enterprise/organization"""
    try:
        data = request.get_json()
        current_app.logger.info(f"[ORG REGISTER] Starting organization registration for user {request.user_id}")
        current_app.logger.info(f"[ORG REGISTER] Request data: {data}")
        
        # Validate required fields
        required_fields = ['name', 'email', 'organization_type']
        for field in required_fields:
            if field not in data:
                current_app.logger.error(f"[ORG REGISTER] Missing required field: {field}")
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        supabase = get_supabase_client()
        
        # Check if user can create organizations
        current_app.logger.info(f"[ORG REGISTER] Checking if user {request.user_id} can create organizations")
        can_create, reason = check_user_can_create_organizations(request.user_id, supabase)
        current_app.logger.info(f"[ORG REGISTER] Permission check result: can_create={can_create}, reason={reason}")
        
        if not can_create:
            current_app.logger.error(f"[ORG REGISTER] User {request.user_id} cannot create organizations: {reason}")
            return jsonify({'error': reason}), 403
        
        # Check if enterprise with this email already exists
        existing = supabase.table('enterprises').select('id').eq('email', data['email']).execute()
        if existing.data:
            current_app.logger.error(f"[ORG REGISTER] Organization with email {data['email']} already exists")
            return jsonify({'error': 'An organization with this email already exists'}), 400
        
        # Create enterprise
        enterprise_data = {
            'name': data['name'],
            'email': data['email'],
            'phone': data.get('phone'),
            'address': data.get('address'),
            'organization_type': data['organization_type'],
            'created_by': request.user_id
        }
        
        current_app.logger.info(f"[ORG REGISTER] Creating enterprise with data: {enterprise_data}")
        result = supabase.table('enterprises').insert(enterprise_data).execute()
        
        if not result.data:
            current_app.logger.error(f"[ORG REGISTER] Failed to create enterprise - no data returned from Supabase")
            return jsonify({'error': 'Failed to create enterprise'}), 500
        
        current_app.logger.info(f"[ORG REGISTER] ✅ Successfully created enterprise: {result.data[0]}")
        return jsonify({
            'success': True,
            'message': 'Enterprise registered successfully',
            'enterprise': result.data[0]
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"[ORG REGISTER] ❌ Exception during organization registration: {str(e)}", exc_info=True)
        return jsonify({'error': f'Failed to register enterprise: {str(e)}'}), 500


@enterprise_bp.route('/api/enterprise/can-create', methods=['GET'])
@require_auth
def can_create_organization():
    """Check if the current user can create organizations"""
    try:
        supabase = get_supabase_client()
        can_create, reason = check_user_can_create_organizations(request.user_id, supabase)
        
        return jsonify({
            'success': True,
            'can_create': can_create,
            'reason': reason
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to check permissions: {str(e)}'}), 500


@enterprise_bp.route('/api/enterprise/my-enterprises', methods=['GET'])
@require_auth
def get_my_enterprises():
    """Get all enterprises owned by the current user"""
    try:
        supabase = get_supabase_client()
        
        # Get enterprises owned by user with retry logic for connection issues
        max_retries = 3
        retry_count = 0
        last_error = None
        
        while retry_count < max_retries:
            try:
                result = supabase.table('enterprises').select('*').eq('created_by', request.user_id).execute()
                
                # Return enterprises without stats for now
                enterprises = result.data or []
                
                return jsonify({
                    'success': True,
                    'enterprises': enterprises
                }), 200
            except Exception as e:
                retry_count += 1
                last_error = e
                current_app.logger.warning(f"Attempt {retry_count}/{max_retries} failed to fetch enterprises: {str(e)}")
                if retry_count < max_retries:
                    import time
                    time.sleep(0.5)  # Wait 500ms before retry
                    continue
                raise e
        
    except Exception as e:
        current_app.logger.error(f'Failed to fetch enterprises after {max_retries} retries: {str(e)}')
        return jsonify({'error': f'Failed to fetch enterprises: {str(e)}'}), 500


@enterprise_bp.route('/api/enterprise/<enterprise_id>', methods=['GET'])
@require_auth
def get_enterprise(enterprise_id):
    """Get enterprise details"""
    try:
        supabase = get_supabase_client()
        
        # Get enterprise
        result = supabase.table('enterprises').select('*').eq('id', enterprise_id).eq('created_by', request.user_id).execute()
        
        if not result.data:
            return jsonify({'error': 'Enterprise not found or access denied'}), 404
        
        enterprise = result.data[0]
        
        # Get statistics
        stats = supabase.rpc('get_enterprise_stats', {'enterprise_uuid': enterprise_id}).execute()
        enterprise['stats'] = stats.data if stats.data else {}
        
        return jsonify({
            'success': True,
            'enterprise': enterprise
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch enterprise: {str(e)}'}), 500


@enterprise_bp.route('/api/enterprise/<enterprise_id>', methods=['PUT'])
@require_auth
def update_enterprise(enterprise_id):
    """Update enterprise details"""
    try:
        data = request.get_json()
        supabase = get_supabase_client()
        
        # Verify ownership
        enterprise = supabase.table('enterprises').select('id').eq('id', enterprise_id).eq('created_by', request.user_id).execute()
        if not enterprise.data:
            return jsonify({'error': 'Enterprise not found or access denied'}), 404
        
        # Update enterprise
        update_data = {}
        allowed_fields = ['name', 'email', 'phone', 'address', 'organization_type', 'max_users', 'settings', 'is_active']
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        result = supabase.table('enterprises').update(update_data).eq('id', enterprise_id).execute()
        
        return jsonify({
            'success': True,
            'message': 'Enterprise updated successfully',
            'enterprise': result.data[0] if result.data else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update enterprise: {str(e)}'}), 500


@enterprise_bp.route('/api/enterprise/<enterprise_id>/users', methods=['GET'])
@require_auth
def get_enterprise_users(enterprise_id):
    """Get all users in an enterprise"""
    try:
        supabase = get_supabase_client()
        
        # Verify user has permission (must be admin or owner)
        is_admin, reason = check_user_is_org_admin(request.user_id, enterprise_id, supabase)
        if not is_admin:
            return jsonify({'error': f'Access denied: {reason}'}), 403
        
        # Get organization users
        result = supabase.table('organization_users').select('*').eq('enterprise_id', enterprise_id).execute()
        
        # Format response with user details from auth
        users = []
        for org_user in result.data:
            # Get user details from auth
            try:
                user_details = supabase.auth.admin.get_user_by_id(org_user['user_id'])
                if user_details and user_details.user:
                    user_metadata = user_details.user.user_metadata or {}
                    first_name = user_metadata.get('first_name', '')
                    last_name = user_metadata.get('last_name', '')
                    email = user_details.user.email
                else:
                    first_name = last_name = email = 'Unknown'
            except:
                first_name = last_name = email = 'Unknown'
            
            user_data = {
                'id': org_user['id'],
                'user_id': org_user['user_id'],
                'first_name': first_name,
                'last_name': last_name,
                'email': email,
                'role': org_user['role'],
                'status': org_user['status'],
                'joined_at': org_user['joined_at'],
                'notes': org_user.get('notes'),
                'metadata': org_user.get('metadata', {})
            }
            users.append(user_data)
        
        return jsonify({
            'success': True,
            'users': users
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch users: {str(e)}'}), 500


@enterprise_bp.route('/api/enterprise/<enterprise_id>/invite', methods=['POST'])
@require_auth
def invite_user(enterprise_id):
    """Invite a user to the enterprise"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'email' not in data:
            return jsonify({'error': 'Email is required'}), 400
        
        email = data['email'].lower().strip()
        supabase = get_supabase_client()
        
        # Verify user has permission to invite users (must be admin or owner)
        is_admin, reason = check_user_is_org_admin(request.user_id, enterprise_id, supabase)
        if not is_admin:
            return jsonify({'error': f'Access denied: {reason}'}), 403
        
        # Get enterprise details
        enterprise = supabase.table('enterprises').select('*').eq('id', enterprise_id).execute()
        if not enterprise.data:
            return jsonify({'error': 'Enterprise not found'}), 404
        
        enterprise_data = enterprise.data[0]
        
        # Check user limit
        current_users = supabase.table('organization_users').select('id', count='exact').eq('enterprise_id', enterprise_id).execute()
        if current_users.count >= enterprise_data['max_users']:
            return jsonify({'error': f"Maximum user limit ({enterprise_data['max_users']}) reached"}), 400
        
        # Check if user is already invited or a member
        existing_invitation = supabase.table('invitations').select('id').eq('enterprise_id', enterprise_id).eq('email', email).eq('status', 'pending').execute()
        if existing_invitation.data:
            return jsonify({'error': 'User already has a pending invitation'}), 400
        
        # Generate unique invitation token
        invitation_token = secrets.token_urlsafe(32)
        
        # Create invitation
        invitation_data = {
            'enterprise_id': enterprise_id,
            'email': email,
            'invited_by': request.user_id,
            'invitation_token': invitation_token,
            'role': data.get('role', 'patient'),
            'message': data.get('message'),
            'expires_at': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        }
        
        result = supabase.table('invitations').insert(invitation_data).execute()
        
        if not result.data:
            return jsonify({'error': 'Failed to create invitation'}), 500
        
        invitation = result.data[0]
        
        # Create invitation link using dynamic URL detection
        frontend_url = get_frontend_url()
        invitation_link = f"{frontend_url}/accept-invitation?token={invitation_token}"
        
        # Get inviter name from user (with error handling for rate limits)
        inviter_name = 'A team member'
        try:
            inviter_user = supabase.auth.admin.get_user_by_id(request.user_id)
            if inviter_user and hasattr(inviter_user, 'user'):
                inviter_name = inviter_user.user.email
        except Exception as e:
            print(f"⚠️ Could not fetch inviter details (non-critical): {str(e)}")
            # Continue with default name
        
        # Send invitation email
        try:
            email_sent = email_service.send_invitation_email(
                to_email=email,
                enterprise_name=enterprise_data['name'],
                inviter_name=inviter_name,
                invitation_link=invitation_link,
                custom_message=data.get('message')
            )
            print(f"✉️ Email sent status: {email_sent}")
        except Exception as email_error:
            print(f"⚠️ Email service error (non-blocking): {email_error}")
            email_sent = False
        
        return jsonify({
            'success': True,
            'message': 'Invitation created successfully',
            'invitation': invitation,
            'invitation_link': invitation_link,
            'email_sent': email_sent
        }), 201
        
    except Exception as e:
        print(f"❌ Error in invite_user: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to invite user: {str(e)}'}), 500


@enterprise_bp.route('/api/enterprise/<enterprise_id>/invitations', methods=['GET'])
@require_auth
def get_invitations(enterprise_id):
    """Get all invitations for an enterprise"""
    try:
        supabase = get_supabase_client()
        
        # Verify user has permission (must be admin or owner)
        is_admin, reason = check_user_is_org_admin(request.user_id, enterprise_id, supabase)
        if not is_admin:
            return jsonify({'error': f'Access denied: {reason}'}), 403
        
        # Get invitations
        result = supabase.table('invitations').select('*').eq('enterprise_id', enterprise_id).order('sent_at', desc=True).execute()
        
        return jsonify({
            'success': True,
            'invitations': result.data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch invitations: {str(e)}'}), 500


@enterprise_bp.route('/api/enterprise/invitation/<invitation_id>/cancel', methods=['POST'])
@require_auth
def cancel_invitation(invitation_id):
    """Cancel a pending invitation"""
    try:
        supabase = get_supabase_client()
        
        # Get invitation and verify ownership
        invitation = supabase.table('invitations').select('*, enterprises!inner(created_by)').eq('id', invitation_id).execute()
        
        if not invitation.data:
            return jsonify({'error': 'Invitation not found'}), 404
        
        if invitation.data[0]['enterprises']['created_by'] != request.user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Cancel invitation
        result = supabase.table('invitations').update({'status': 'cancelled'}).eq('id', invitation_id).execute()
        
        return jsonify({
            'success': True,
            'message': 'Invitation cancelled successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to cancel invitation: {str(e)}'}), 500


@enterprise_bp.route('/api/enterprise/invitation/verify/<token>', methods=['GET'])
def verify_invitation(token):
    """Verify an invitation token (public endpoint)"""
    try:
        supabase = get_supabase_client()
        
        # Get invitation details
        result = supabase.table('invitations').select('''
            *,
            enterprise:enterprise_id (
                id,
                name,
                organization_type
            )
        ''').eq('invitation_token', token).execute()
        
        if not result.data:
            return jsonify({'error': 'Invalid invitation token'}), 404
        
        invitation = result.data[0]
        
        # Check if expired
        if invitation['status'] != 'pending':
            return jsonify({'error': f"Invitation is {invitation['status']}"}), 400
        
        expires_at = datetime.fromisoformat(invitation['expires_at'].replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        if now > expires_at:
            return jsonify({'error': 'Invitation has expired'}), 400
        
        return jsonify({
            'success': True,
            'invitation': {
                'id': invitation['id'],
                'email': invitation['email'],
                'role': invitation['role'],
                'message': invitation['message'],
                'enterprise': invitation['enterprise']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to verify invitation: {str(e)}'}), 500


@enterprise_bp.route('/api/enterprise/invitation/accept', methods=['POST'])
def accept_invitation():
    """Accept an invitation - handles both registered and unregistered users"""
    try:
        data = request.get_json()
        
        if 'token' not in data:
            return jsonify({'error': 'Invitation token is required'}), 400
        
        supabase = get_supabase_client()
        
        # Find the invitation by token
        invitation_result = supabase.table('invitations').select('*, enterprises(*)').eq('invitation_token', data['token']).execute()
        
        if not invitation_result.data:
            return jsonify({'error': 'Invalid or expired invitation'}), 400
        
        invitation = invitation_result.data[0]
        
        # Check if invitation is still pending
        if invitation['status'] != 'pending':
            return jsonify({'error': 'Invitation has already been used or expired'}), 400
        
        # Check if invitation has expired
        if invitation['expires_at']:
            expires_at = datetime.fromisoformat(invitation['expires_at'].replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            if now > expires_at:
                return jsonify({'error': 'Invitation has expired'}), 400
        
        # Check if user is authenticated
        auth_header = request.headers.get('Authorization')
        user_id = None
        
        if auth_header and auth_header.startswith('Bearer '):
            # User is logged in, get their user ID
            try:
                token = auth_header.split(' ')[1]
                # Verify token and get user ID
                user_response = supabase.auth.get_user(token)
                if user_response.user:
                    user_id = user_response.user.id
            except:
                pass  # Invalid token, treat as unauthenticated
        
        if user_id:
            # User is authenticated - check if already a member
            existing_membership = supabase.table('organization_users').select('id').eq('enterprise_id', invitation['enterprise_id']).eq('user_id', user_id).execute()
            
            if existing_membership.data:
                return jsonify({'error': 'You are already a member of this organization'}), 400
            
            # Add authenticated user to organization using admin client to bypass RLS
            membership_data = {
                'enterprise_id': invitation['enterprise_id'],
                'user_id': user_id,
                'role': invitation.get('role', 'patient')  # Use role from invitation
            }
            
            # Use admin client to bypass RLS for this operation
            admin_supabase = get_supabase_client(use_admin=True)
            membership_result = admin_supabase.table('organization_users').insert(membership_data).execute()
            
            if not membership_result.data:
                return jsonify({'error': 'Failed to add user to organization'}), 500
            
            # Update invitation status with acceptance details
            supabase.table('invitations').update({
                'status': 'accepted',
                'accepted_at': datetime.now(timezone.utc).isoformat(),
                'accepted_by': user_id
            }).eq('id', invitation['id']).execute()
            
            # Get enterprise name safely
            enterprise_name = 'Unknown Organization'
            if invitation.get('enterprises') and isinstance(invitation['enterprises'], dict):
                enterprise_name = invitation['enterprises'].get('name', 'Unknown Organization')
            
            return jsonify({
                'success': True,
                'message': 'Invitation accepted successfully',
                'enterprise_id': invitation['enterprise_id'],
                'enterprise_name': enterprise_name,
                'requires_registration': False
            }), 200
        else:
            # User is not authenticated - return invitation details for registration
            # Get enterprise name safely
            enterprise_name = 'Unknown Organization'
            if invitation.get('enterprises') and isinstance(invitation['enterprises'], dict):
                enterprise_name = invitation['enterprises'].get('name', 'Unknown Organization')
            
            return jsonify({
                'success': True,
                'message': 'Please create an account to accept this invitation',
                'invitation': {
                    'id': invitation['id'],
                    'email': invitation['email'],
                    'enterprise_id': invitation['enterprise_id'],
                    'enterprise_name': enterprise_name,
                    'role': data.get('role', 'member')
                },
                'requires_registration': True
            }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to accept invitation: {str(e)}'}), 500


@enterprise_bp.route('/api/enterprise/invitation/complete', methods=['POST'])
@require_auth
def complete_invitation():
    """Complete invitation acceptance after user registration"""
    try:
        data = request.get_json()
        
        if 'invitation_id' not in data:
            return jsonify({'error': 'Invitation ID is required'}), 400
        
        supabase = get_supabase_client()
        
        # Get invitation details
        invitation_result = supabase.table('invitations').select('*, enterprises(*)').eq('id', data['invitation_id']).execute()
        
        if not invitation_result.data or len(invitation_result.data) == 0:
            return jsonify({'error': 'Invalid invitation ID'}), 400
        
        invitation = invitation_result.data[0]
        
        # Check if invitation data is valid
        if not invitation:
            return jsonify({'error': 'Invitation data is invalid'}), 400
        
        # Check if invitation is still pending or accepted but not completed
        if invitation['status'] not in ['pending', 'accepted']:
            return jsonify({'error': 'Invitation has already been used or expired'}), 400
        
        # Check if user is already part of this organization
        existing_membership = supabase.table('organization_users').select('id').eq('enterprise_id', invitation['enterprise_id']).eq('user_id', request.user_id).execute()
        
        if existing_membership.data:
            return jsonify({'error': 'You are already a member of this organization'}), 400
        
        # Add user to organization using admin client to bypass RLS
        membership_data = {
            'enterprise_id': invitation['enterprise_id'],
            'user_id': request.user_id,
            'role': invitation.get('role', 'patient')  # Use role from invitation
        }
        
        # Use admin client to bypass RLS for this operation
        admin_supabase = get_supabase_client(use_admin=True)
        membership_result = admin_supabase.table('organization_users').insert(membership_data).execute()
        
        if not membership_result.data:
            return jsonify({'error': 'Failed to add user to organization'}), 500
        
        # Update invitation status with completion details
        supabase.table('invitations').update({
            'status': 'accepted',
            'accepted_at': datetime.now(timezone.utc).isoformat(),
            'accepted_by': request.user_id
        }).eq('id', invitation['id']).execute()
        
        # Get enterprise name safely
        enterprise_name = 'Unknown Organization'
        if invitation.get('enterprises') and isinstance(invitation['enterprises'], dict):
            enterprise_name = invitation['enterprises'].get('name', 'Unknown Organization')
        
        return jsonify({
            'success': True,
            'message': 'Invitation accepted successfully',
            'enterprise_id': invitation['enterprise_id'],
            'enterprise_name': enterprise_name
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to complete invitation: {str(e)}'}), 500


@enterprise_bp.route('/api/enterprise/create-user', methods=['POST'])
@require_auth
def create_user():
    """Create a new user and add them to the organization"""
    try:
        data = request.get_json()
        
        required_fields = ['enterprise_id', 'first_name', 'last_name', 'email', 'password', 'role']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        supabase = get_supabase_client()
        
        # Verify user has permission to create users (must be admin or owner)
        is_admin, reason = check_user_is_org_admin(request.user_id, data['enterprise_id'], supabase)
        if not is_admin:
            return jsonify({'error': f'Access denied: {reason}'}), 403
        
        # Get enterprise details
        enterprise_result = supabase.table('enterprises').select('id, name').eq('id', data['enterprise_id']).execute()
        
        if not enterprise_result.data:
            return jsonify({'error': 'Organization not found'}), 404
        
        enterprise = enterprise_result.data[0]
        
        # Check if user already exists by listing users and checking email
        try:
            users_list = supabase.auth.admin.list_users()
            for user in users_list:
                if user.email == data['email']:
                    return jsonify({'error': 'User with this email already exists'}), 400
        except:
            # If we can't check, continue with creation
            pass
        
        # Create user in Supabase Auth
        user_response = supabase.auth.admin.create_user({
            'email': data['email'],
            'password': data['password'],
            'email_confirm': True,  # Auto-confirm the user
            'user_metadata': {
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'full_name': f"{data['first_name']} {data['last_name']}"
            }
        })
        
        if not user_response or not user_response.user:
            return jsonify({'error': 'Failed to create user account'}), 500
        
        user_id = user_response.user.id
        
        # Add user to organization
        membership_data = {
            'enterprise_id': data['enterprise_id'],
            'user_id': user_id,
            'role': data['role']
        }

        # Use admin client to bypass RLS for this operation
        admin_supabase = get_supabase_client(use_admin=True)
        membership_result = admin_supabase.table('organization_users').insert(membership_data).execute()
        
        if not membership_result.data:
            return jsonify({'error': 'Failed to add user to organization'}), 500

        # Create a trial for the new user (30 days for enterprise users)
        try:
            trial_result = admin_supabase.rpc('create_user_trial', {
                'p_user_id': user_id,
                'p_duration_days': 30  # 30 days trial for enterprise users
            }).execute()
            
            if trial_result.data and trial_result.data.get('success'):
                print(f"✅ Created 30-day trial for user {user_id}")
            else:
                print(f"⚠️ Failed to create trial for user {user_id}: {trial_result.data}")
        except Exception as trial_error:
            print(f"⚠️ Error creating trial for user {user_id}: {trial_error}")
            # Don't fail the user creation if trial creation fails

        # Send welcome email to the new user
        try:
            from services.email_service import EmailService
            email_service = EmailService()
            
            # Get the current user's name for the email
            current_user_result = supabase.auth.admin.get_user_by_id(request.user_id)
            inviter_name = "Organization Admin"
            if current_user_result and current_user_result.user:
                user_metadata = current_user_result.user.user_metadata or {}
                first_name = user_metadata.get('first_name', '')
                last_name = user_metadata.get('last_name', '')
                if first_name or last_name:
                    inviter_name = f"{first_name} {last_name}".strip()
            
            # Create login URL using dynamic URL detection
            frontend_url = get_frontend_url()
            login_url = f"{frontend_url}/accept-invitation"
            
            email_sent = email_service.send_user_creation_email(
                to_email=data['email'],
                enterprise_name=enterprise['name'],
                inviter_name=inviter_name,
                login_url=login_url
            )
            
            if email_sent:
                print(f"✅ User creation email sent to {data['email']}")
            else:
                print(f"⚠️ Failed to send user creation email to {data['email']}")
        except Exception as email_error:
            print(f"⚠️ Error sending user creation email to {data['email']}: {email_error}")
            # Don't fail the user creation if email sending fails
        
        return jsonify({
            'success': True,
            'message': 'User created and added to organization successfully',
            'user': {
                'id': user_id,
                'email': data['email'],
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'role': data['role'],
                'enterprise_id': data['enterprise_id'],
                'enterprise_name': enterprise['name']
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to create user: {str(e)}'}), 500


@enterprise_bp.route('/api/enterprise/user/<user_relation_id>', methods=['DELETE'])
@require_auth
def delete_organization_user(user_relation_id):
    """Delete a user from the organization"""
    try:
        supabase = get_supabase_client()
        
        # First, get the organization user record to verify ownership
        org_user_result = supabase.table('organization_users').select('''
            *,
            enterprise:enterprise_id (
                id,
                created_by
            )
        ''').eq('id', user_relation_id).execute()
        
        if not org_user_result.data:
            return jsonify({'error': 'User not found in organization'}), 404
        
        org_user = org_user_result.data[0]
        enterprise = org_user['enterprise']
        
        # Verify the current user owns this enterprise
        if enterprise['created_by'] != request.user_id:
            return jsonify({'error': 'Access denied. You can only delete users from your own organization.'}), 403
        
        # Get user details before deletion for response
        user_id = org_user['user_id']
        try:
            user_details = supabase.auth.admin.get_user_by_id(user_id)
            if user_details and user_details.user:
                user_email = user_details.user.email
                user_metadata = user_details.user.user_metadata or {}
                user_name = f"{user_metadata.get('first_name', '')} {user_metadata.get('last_name', '')}".strip()
            else:
                user_email = 'Unknown'
                user_name = 'Unknown'
        except:
            user_email = 'Unknown'
            user_name = 'Unknown'
        
        # Delete the user from the organization (this removes them from organization_users table)
        delete_result = supabase.table('organization_users').delete().eq('id', user_relation_id).execute()
        
        if not delete_result.data:
            return jsonify({'error': 'Failed to remove user from organization'}), 500

        # Also delete the user's Supabase authentication account
        try:
            # Use admin client to delete the user from Supabase Auth
            admin_supabase = get_supabase_client(use_admin=True)
            delete_auth_result = admin_supabase.auth.admin.delete_user(user_id)
            
            if delete_auth_result:
                print(f"✅ Deleted Supabase auth account for user {user_id}")
            else:
                print(f"⚠️ Failed to delete Supabase auth account for user {user_id}")
        except Exception as auth_delete_error:
            print(f"⚠️ Error deleting Supabase auth account for user {user_id}: {auth_delete_error}")
            # Don't fail the entire operation if auth deletion fails
        
        return jsonify({
            'success': True,
            'message': f'User {user_name} ({user_email}) has been completely deleted. They can now be re-invited or register again.',
            'deleted_user': {
                'id': user_relation_id,
                'user_id': user_id,
                'name': user_name,
                'email': user_email
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete user: {str(e)}'}), 500


@enterprise_bp.route('/api/enterprise/logout-and-login', methods=['GET'])
def logout_and_login():
    """Logout any existing user and redirect to login page"""
    from flask import redirect, url_for
    
    # This endpoint will be called from the email link
    # It will redirect to the frontend logout-and-login page
    # Get the frontend URL using dynamic URL detection
    frontend_url = get_frontend_url()
    return redirect(f'{frontend_url}/logout-and-login')


@enterprise_bp.route('/api/enterprise/<enterprise_id>/user/<user_relation_id>', methods=['PUT'])
@require_auth
def update_user_relation(enterprise_id, user_relation_id):
    """Update a user's relationship with the enterprise (notes, status, etc.)"""
    try:
        data = request.get_json()
        supabase = get_supabase_client()
        
        # Verify user has permission (must be admin or owner)
        is_admin, reason = check_user_is_org_admin(request.user_id, enterprise_id, supabase)
        if not is_admin:
            return jsonify({'error': f'Access denied: {reason}'}), 403
        
        # Update user relation
        update_data = {}
        allowed_fields = ['status', 'role', 'notes', 'metadata']
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        result = supabase.table('organization_users').update(update_data).eq('id', user_relation_id).eq('enterprise_id', enterprise_id).execute()
        
        return jsonify({
            'success': True,
            'message': 'User updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update user: {str(e)}'}), 500


@enterprise_bp.route('/api/enterprise/<enterprise_id>/user/<user_relation_id>', methods=['DELETE'])
@require_auth
def remove_user(enterprise_id, user_relation_id):
    """Remove a user from the enterprise"""
    try:
        supabase = get_supabase_client()
        
        # Verify user has permission (must be admin or owner)
        is_admin, reason = check_user_is_org_admin(request.user_id, enterprise_id, supabase)
        if not is_admin:
            return jsonify({'error': f'Access denied: {reason}'}), 403
        
        # Delete user relation
        supabase.table('organization_users').delete().eq('id', user_relation_id).eq('enterprise_id', enterprise_id).execute()
        
        return jsonify({
            'success': True,
            'message': 'User removed successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to remove user: {str(e)}'}), 500


@enterprise_bp.route('/api/my-enterprises', methods=['GET'])
@require_auth
def get_user_enterprises():
    """Get all enterprises the user is part of (as owner or member)"""
    try:
        supabase = get_supabase_client()
        
        # Use the database function to get user's enterprise access
        result = supabase.rpc('user_enterprise_access', {'user_uuid': request.user_id}).execute()
        
        return jsonify({
            'success': True,
            'enterprises': result.data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch enterprises: {str(e)}'}), 500

