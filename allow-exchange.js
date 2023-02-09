const Web3 = require("web3");
const fetch = require("node-fetch");
const yesno = require("yesno");

const chainId = 56;
const web3RpcUrl = "https://bsc-dataseed.binance.org";
const walletAddress = "0x28992dF25Cf8D53Afb197C11198C32c5B872ef94"; // Set your wallet address
const privateKey =
  ""; // Set private key of your wallet. Be careful! Don't share this key to anyone!

const swapParams = {
  fromTokenAddress: "0x5546600f77eda1dcf2e8817ef4d617382e7f71f5", // PING
  toTokenAddress: "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3", // DAI
  amount: "50000000000",
  fromAddress: walletAddress,
  slippage: 1,
  disableEstimate: false,
  allowPartialFill: false,
};

const broadcastApiUrl =
  "https://tx-gateway.1inch.io/v1.1/" + chainId + "/broadcast";
const apiBaseUrl = "https://api.1inch.io/v5.0/" + chainId;
const web3 = new Web3(web3RpcUrl);

function apiRequestUrl(methodName, queryParams) {
  return (
    apiBaseUrl + methodName + "?" + new URLSearchParams(queryParams).toString()
  );
}

async function broadCastRawTransaction(rawTransaction) {
  return fetch(broadcastApiUrl, {
    method: "post",
    body: JSON.stringify({ rawTransaction }),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((res) => {
      return res.transactionHash;
    });
}

async function signAndSendTransaction(transaction) {
  const { rawTransaction } = await web3.eth.accounts.signTransaction(
    transaction,
    privateKey
  );

  return await broadCastRawTransaction(rawTransaction);
}

async function buildTxForApproveTradeWithRouter(tokenAddress, amount) {
  const url = apiRequestUrl(
    "/approve/transaction",
    amount ? { tokenAddress, amount } : { tokenAddress }
  );

  const transaction = await fetch(url).then((res) => res.json());

  const gasLimit = await web3.eth.estimateGas({
    ...transaction,
    from: walletAddress,
  });

  return {
    ...transaction,
    gas: gasLimit,
  };
}

const doTx = async () => {
  // First, let's build the body of the transaction
  const transactionForSign = await buildTxForApproveTradeWithRouter(
    swapParams.fromTokenAddress
  );
  console.log("Transaction for approve: ", transactionForSign);

  const ok = await yesno({
    question:
      "Do you want to send a transaction to approve trade with 1inch router?",
  });

  // Before signing a transaction, make sure that all parameters in it are specified correctly
  if (!ok) {
    return false;
  }

  // Send a transaction and get its hash
  const approveTxHash = await signAndSendTransaction(transactionForSign);
  console.log("Approve tx hash: ", approveTxHash);
};

doTx();
