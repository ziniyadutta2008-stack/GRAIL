"""Authentication and authorization.

Identity comes only from claims that API Gateway's Cognito JWT authorizer has already
validated. Organization membership and role come from the database through
``grail.organizations``. Authorization is enforced here, never in the UI.
"""
