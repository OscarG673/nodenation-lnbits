const DOMAIN = import.meta.env.VITE_NODE_URL;
const URL = DOMAIN + 'api/v1/'
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY;
const INVOICE_KEY = import.meta.env.VITE_INVOICE_KEY;

//función para consultar a la api de LNBits
const fetchData = async (action, method, key, body) => {
  const response = await fetch(URL + action, {
    method: method,
    headers: {
      "X-Api-Key": key,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  return await response.json();
};

const getWalletDetails = async () => {
return await fetchData('wallet', 'GET', INVOICE_KEY);
};

//actualizar saldo
const getBalance = async () => {
try {
    const walletDetails = await getWalletDetails();

    if (walletDetails && walletDetails.balance !== undefined) {
    const balance = walletDetails.balance / 1000; 
    document.getElementById('wallet-balance').innerText = `${balance} SATS`;
    } else {
    document.getElementById('wallet-balance').innerText = 'Error de API';
    }
    } catch (error) {
        document.getElementById('wallet-balance').innerText = 'Error de API';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    getBalance();
});

function showModal(content) {
  document.getElementById('modal').classList.remove('hidden');
  const modalContent = document.getElementById('modal-content');
  modalContent.innerHTML = content;
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

function showReceiveModal() {
  showModal(`
    <h2 class='text-xl font-semibold mb-4'>Create Invoice</h2>
    <label class='block mb-2'>Amount (sats):</label>
    <input id='invoice-amount' type='number' placeholder='Enter amount (sats)' class='w-full p-2 mb-4 rounded-md bg-gray-700 text-white'>
    <label class='block mb-2'>Memo:</label>
    <input id='invoice-memo' type='text' placeholder='Memo' class='w-full p-2 mb-4 rounded-md bg-gray-700 text-white'>
    <button class='w-full py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600' onclick='generateInvoice()'>Generate Invoice</button>
  `);
}

//obtener invoice
async function generateInvoice() {
  const amount = document.getElementById('invoice-amount').value;
  const memo = document.getElementById('invoice-memo').value;
  const data = await fetchData('payments', 'POST', INVOICE_KEY, {
    out: false,
    amount: parseInt(amount),
    memo: memo,
    expiry: 3600
  });

  showModal(`
    <h2 class='text-xl font-semibold mb-4'>Invoice Generated</h2>
    <p class='text-lg break-all'>Invoice: ${data.payment_request}</p>
    <button class='w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600 mt-4' onclick='closeModal()'>Close</button>
  `);
}


function showSendModal() {
  showModal(`
    <h2 class='text-xl font-semibold mb-4'>Pay Invoice</h2>
    <label class='block mb-2'>Paste Invoice:</label>
    <input id='pay-invoice' type='text' placeholder='Paste an invoice' class='w-full p-2 mb-4 rounded-md bg-gray-700 text-white'>
    <button class='w-full py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600' onclick='readInvoice()'>Read Invoice</button>
  `);
}

async function readInvoice() {
  const bolt = document.getElementById('pay-invoice').value;
  const data = await fetchData('payments/decode', 'POST', null, { data: bolt });
  console.log(data.amount)
  showModal(`
    <h2 class='text-xl font-semibold mb-4'>Invoice Details</h2>
    <p class='text-lg'>Amount: ${data.amount_msat/1000} sats</p>
    <p class='text-lg'>Memo: ${data.description}</p>
    <button class='w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600 mt-4' onclick='payInvoice("${bolt}")'>Pay</button>
  `);
}
async function payInvoice(bolt) {
  const data = await fetchData('payments', 'POST', ADMIN_KEY, {
    out: true,
    bolt11: bolt
  });
  alert(data.payment_hash ? 'Payment Successful!' : 'Payment Failed!');
  closeModal();
}