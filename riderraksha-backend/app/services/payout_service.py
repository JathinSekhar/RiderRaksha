import random
import string
import requests # 👈 New import
from datetime import datetime

# In production, this would be your Razorpay or Bank Webhook URL
MOCK_WEBHOOK_URL = "https://webhook.site/e4e606b9-c55a-446f-bef6-6e193384a878" 

def simulate_upi_payout(worker, amount):
    """
    Simulated Razorpay UPI payout that now sends a Webhook notification.
    """
    payout_id  = "pay_" + ''.join(random.choices(string.ascii_letters + string.digits, k=14))
    ref_id     = f"RR{worker.id}{int(datetime.utcnow().timestamp())}"
    upi_handle = f"{worker.phone}@upi"

    payout_data = {
        'status':    'SUCCESS',
        'payout_id': payout_id,
        'ref_id':    ref_id,
        'worker_name': worker.full_name,
        'upi_handle': upi_handle,
        'amount':    amount,
        'currency':  'INR',
        'timestamp': datetime.utcnow().isoformat(),
    }

    # ── WEBHOOK INTEGRATION (SIMULATION) ──────────────────────────
    try:
        # We use a timeout so the app doesn't hang if the "bank" is slow
        # In a real demo, you can use a site like webhook.site to see this live!
        response = requests.post(
            MOCK_WEBHOOK_URL, 
            json=payout_data, 
            timeout=5
        )
        payout_data['webhook_status'] = 'SENT'
        print(f"[WEBHOOK] Payout notification sent to Gateway. Status: {response.status_code}")
    except Exception as e:
        payout_data['webhook_status'] = 'FAILED'
        print(f"[WEBHOOK ⚠️] Could not reach Payment Gateway: {str(e)}")
    # ───────────────────────────────────────────────────────────────

    payout_data['message'] = f'Rs {amount} credited to {upi_handle} via Razorpay'
    return payout_data