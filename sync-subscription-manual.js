// Manual Subscription Sync Script
// Run this in browser console while logged into staging

(async function syncSubscription() {
  try {
    console.log('🔄 Syncing subscription...');
    
    const response = await fetch('/api/subscription/sync', {
      method: 'POST',
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (data.success && data.subscription?.tier) {
      console.log('✅ SUCCESS! Synced to:', data.subscription.tier);
      alert(`✅ Subscription synced! You are now on the ${data.subscription.tier.toUpperCase()} plan. Refresh the page.`);
      window.location.reload();
    } else if (data.success) {
      console.log('ℹ️ No active subscription found in Polar');
      alert('ℹ️ No active subscription found. Check Polar dashboard.');
    } else {
      console.error('❌ Error:', data.error);
      alert(`❌ Error: ${data.error}`);
    }
  } catch (error) {
    console.error('❌ Failed to sync:', error);
    alert(`❌ Failed to sync: ${error.message}`);
  }
})();

