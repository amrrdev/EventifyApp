// Debug script to test authentication and cookies
// Run this in browser console on your domain

async function debugAuth() {
    console.log('=== Authentication Debug ===');
    
    // Check current cookies
    console.log('Current cookies:', document.cookie);
    
    // Test sign-in
    try {
        console.log('Testing sign-in...');
        const signInResponse = await fetch('https://api.evntfy.tech/api/v1/auth/sign-in', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'your-test-email@example.com', // Replace with actual test credentials
                password: 'your-password'
            })
        });
        
        console.log('Sign-in response status:', signInResponse.status);
        console.log('Sign-in response headers:', Object.fromEntries(signInResponse.headers.entries()));
        
        if (signInResponse.ok) {
            const data = await signInResponse.json();
            console.log('Sign-in response data:', data);
            
            // Check cookies after sign-in
            console.log('Cookies after sign-in:', document.cookie);
            
            // Test refresh token
            console.log('Testing refresh token...');
            const refreshResponse = await fetch('https://api.evntfy.tech/api/v1/auth/refresh-token', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            console.log('Refresh response status:', refreshResponse.status);
            console.log('Refresh response headers:', Object.fromEntries(refreshResponse.headers.entries()));
            
            if (!refreshResponse.ok) {
                const errorData = await refreshResponse.json();
                console.error('Refresh error:', errorData);
            } else {
                const refreshData = await refreshResponse.json();
                console.log('Refresh success:', refreshData);
            }
        } else {
            const errorData = await signInResponse.json();
            console.error('Sign-in error:', errorData);
        }
        
    } catch (error) {
        console.error('Network error:', error);
    }
}

// Run the debug
debugAuth();
