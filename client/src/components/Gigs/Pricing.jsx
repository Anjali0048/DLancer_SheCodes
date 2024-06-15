import React, { useEffect, useState } from "react";
import { FiClock, FiRefreshCcw } from "react-icons/fi";
import { BiRightArrowAlt } from "react-icons/bi";
import { BsCheckLg } from "react-icons/bs";
import { useStateProvider } from "../../context/StateContext";
import { useRouter } from "next/router";
import { useStateProviderBlock } from "../../context/StateContext_Block";
import {
  ADD_FREELANCER_ADDRESS,
  APPEND_ESCROW,
  GET_ESCROW,
} from "../../utils/constants";
import { ethers } from "ethers";
import Escrow from "../../abis/Escrow.json";
import axios from "axios";
import { useCookies } from "react-cookie";
import { useParam } from "react-router-dom";
function Pricing() {
  const [{ gigData, userInfo }, dispatch] = useStateProvider();
  const router = useRouter();

  // Blockchain code
  const [cookies] = useCookies();
  const { state } = useStateProviderBlock();
  let [escrowContract, setEscrowContract] = useState(null);
  const [escrowAddress, setEscrowAddress] = useState("");
  const currentAddress = state.currentAddress;
  const signer = state.signer;
  const [gigId, setGigId] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const [isApproved, setIsApproved] = useState(false);

  const arbiter = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const freelanceContractAddress = state.freelanceContractAddress;
  const freelanceTokenContract = state.freelanceTokenContract;

  const handleSendRequest = async () => {
    const id = gigData.id; // Assuming 'id' is obtained from somewhere in your component state
    const currentAddress = state.currentAddress;

    if (id && currentAddress) {
      try {
        const response = await axios.put(
          ADD_FREELANCER_ADDRESS,
          { id, currentAddress },
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cookies.jwt}`,
            },
          }
        );

        if (response.status === 200) {
          // Successfully updated freelancer address
          console.log("Freelancer address updated successfully!");
          alert("Request sent successfully");
        } else {
          // Handle error
          console.error("Failed to update freelancer address");
        }
      } catch (error) {
        console.error("Error updating freelancer address:", error);
      }
    } else {
      console.error("ID and client address are required.");
    }
  };

  const tokens = (n) => {
    return ethers.parseUnits(n.toString(), "ether");
  };

  const handleRetrieve = async () => {
    // window.location.reload()
    // window.location.reload()
    try {
      let id = 2;
      // let id = gigData.id;
      const response = await axios.get(`http://localhost:8747/contract/${id}`);
      console.log("Response is ", response.data);
      // setEscrowContract(response.data.escrowContract);
      const add = await response.data[0].target;
      console.log("Address is ", add);
      setEscrowAddress(add);
      console.log("escrowAdd", escrowAddress);
      const contract = new ethers.Contract(escrowAddress, Escrow.abi, signer);
      setEscrowContract(contract);
      console.log(escrowContract);
      // alert('Contract retrieved successfully!');
    } catch (error) {
      console.error("Error retrieving data:", error);
      // alert('Error retrieving data');
    }
  };

  const deposit = async () => {
    let amount = gigData.price;
    console.log("Escrow : ", escrowContract);
    try {
      // handleRetrieve()
      // if (freelanceTokenContract && escrowContract && currentAddress) {
      console.log("F", freelanceTokenContract);
      console.log("E", escrowContract);
      if (freelanceTokenContract && escrowContract) {
        const tx = await freelanceTokenContract.approve(
          escrowAddress,
          tokens(amount)
        );
        await tx.wait();
        const depositTx = await escrowContract.deposit(tokens(amount));
        await depositTx.wait();
      } else {
        // alert('Only the client can deposit funds.');
      }
    } catch (error) {
      console.error("Error during deposit:", error);
    }
  };

  const handleApprove = async () => {
    let freelancerAddress = gigData.freelancerAddress;
    let clientAddress = gigData.clientAddress;
    let submissionDeadline = gigData.deliveryTime;
    let id = gigData.id;
    let amount = gigData.price;
    console.log(freelancerAddress);
    console.log(clientAddress);
    console.log(submissionDeadline);
    console.log(id);
    try {
      const EscrowFactory = new ethers.ContractFactory(
        Escrow.abi,
        Escrow.bytecode,
        signer
      );
      const escrowContract = await EscrowFactory.deploy(
        clientAddress,
        freelancerAddress,
        arbiter,
        freelanceContractAddress,
        submissionDeadline
      );
      setEscrowContract(escrowContract);
      console.log("EscrowContract : ", escrowContract);

      const escrowAddress = await escrowContract.getAddress();
      setEscrowAddress(escrowAddress);
      console.log("Escrow address : ", escrowAddress);

      // append escrow contract to the file
      try {
        await axios.post(APPEND_ESCROW, {
          id,
          escrowContract,
        });
        alert("Data appended successfully");
      } catch (error) {
        console.error("Error appending data:", error);
        alert("Error appending data");
      }
      // deposit(amount);
      alert("Escrow contract deployed successfully");
      setIsApproved(true);
    } catch (error) {
      console.error("Error deploying contract:", error);
      alert("Error deploying contract");
    }
  };

  console.log("Escrow Contract state", escrowContract);
  const submitWork = async (fileUrl) => {
    try {
      // if (escrowContract && currentAddress === freelancerAddress) {
      if (escrowContract) {
        const tx = await escrowContract.submitWork(fileUrl);
        await tx.wait();
        setFileUrl(fileUrl);
      } else {
        alert("Only the freelancer can submit work.");
      }
    } catch (error) {
      console.error("Error during work submission:", error);
    }
  };

  const fetchFileDetails = async () => {
    const fileDetails = await escrowContract.getFileDetails();
    setFileUrl(fileDetails[0]);
  };

  const confirmDelivery = async () => {
    try {
      if (escrowContract) {
        const tx = await escrowContract.confirmDelivery();
        await tx.wait();
      } else {
        alert("Only the client can confirm delivery.");
      }
    } catch (error) {
      console.error("Error during delivery confirmation:", error);
    }
  };

  // useEffect(()=>{
  //   handleRetrieve()
  // },[])

  return (
    <>
      {gigData && (
        
        <div className="sticky flex flex-col top-36 mb-10 h-max w-96 gap-5">
         {  
         <div className="flex flex-col items-center justify-center">
          <>
          <button
                className="w-[300px] flex items-center bg-[#1DBF73] text-white py-2 justify-center font-bold text-lg relative rounded"
                onClick={handleRetrieve}
              >
                Get Escow Details
            </button>
            <p>Escrow Address : {escrowAddress}</p>
          </>

          <button className="w-[300px] flex items-center bg-[#1DBF73] text-white py-2 justify-center font-bold text-lg relative rounded" onClick={fetchFileDetails}>Get File Details</button>
          {fileUrl && (
            <div>
              <p>fileUrl : {fileUrl}</p>
            </div>
          )}
         </div>
         
          }
          <div className="border p-10 flex flex-col gap-5">
            <div className="flex justify-between">
              <h4 className="text-md font-normal text-[#74767e]">
                {gigData.shortDesc}
              </h4>
              <h6 className="font-medium text-lg">${gigData.price}</h6>
            </div>
            <div>
              <div className="text-[#62646a] font-semibold text-sm flex gap-6">
                <div className="flex items-center gap-2">
                  <FiClock className="text-xl" />
                  <span>{gigData.deliveryTime} Days Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiRefreshCcw className="text-xl" />
                  <span>{gigData.revisions} Revisions</span>
                </div>
              </div>
              <ul></ul>
            </div>
            <ul className="flex gap-1 flex-col">
              {gigData.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <BsCheckLg className="text-[#1DBF73] text-lg" />
                  <span className="text-[#4f5156]">{feature}</span>
                </li>
              ))}
            </ul>
            {gigData.userId === userInfo.id ? (
              <button
                className="flex items-center bg-[#1DBF73] text-white py-2 justify-center font-bold text-lg relative rounded"
                onClick={() => router.push(`/freelancer/gigs/${gigData.id}`)}
              >
                <span>Edit</span>
                <BiRightArrowAlt className="text-2xl absolute right-4" />
              </button>
            ) : gigData.freelancerAddress ? (
              <button
                className="disabled flex items-center bg-[#1DBF73] text-white py-2 justify-center font-bold text-lg relative rounded opacity-70 cursor-not-allowed"
                onClick={handleSendRequest}
              >
                <span>Request Sent</span>
                {/* <BiRightArrowAlt className="text-2xl absolute right-4" /> */}
              </button>
            ) : (
              <button
                className="flex items-center bg-[#1DBF73] text-white py-2 justify-center font-bold text-lg relative rounded"
                onClick={handleSendRequest}
              >
                <span>Send Request</span>
                <BiRightArrowAlt className="text-2xl absolute right-4" />
              </button>
            )}

            {
              gigData.freelancerAddress == currentAddress && escrowAddress ? (
              <>
                <input
                  type="text"
                  id="fileUrl"
                  placeholder="submit task link"
                  className="border border-black p-2"
                />
                <button
                  className="disabled flex items-center bg-[#1DBF73] text-white py-2 justify-center font-bold text-lg relative rounded"
                  onClick={() =>
                    submitWork(document.getElementById("fileUrl").value)
                  }
                >
                  <span>Submit Task</span>
                  {/* <BiRightArrowAlt className="text-2xl absolute right-4" /> */}
                </button>
              </>

              ):("")
            }
            {gigData.userId === userInfo.id && gigData.freelancerAddress ? (
              <p>
                Request From :{" "}
                {
                  <span>
                    {gigData.freelancerAddress.slice(0, 6) +
                      "..." +
                      gigData.freelancerAddress.slice(38, 42)}
                  </span>
                }{" "}
              </p>
            ) : (
              ""
            )}

            {gigData.freelancerAddress && gigData.userId === userInfo.id ? (
              <button
                className="flex items-center bg-[#1DBF73] text-white py-2 justify-center font-bold text-lg relative rounded"
                onClick={handleApprove}
              >
                {!isApproved? ("Approve") : ("Approved")}
              </button>
            ) : (
              ""
            )}

            {gigData.freelancerAddress && gigData.userId === userInfo.id && isApproved ? (
              <button
                className="flex items-center bg-[#1DBF73] text-white py-2 justify-center font-bold text-lg relative rounded"
                onClick={deposit}
              >
                Deposit
              </button>
            ) : (
              ""
            )}
          </div>

          {gigData.userId === userInfo.id && <div className="w-full flex flex-col items-center justify-center">
            <h2 className="w-full m-auto font-bold mb-4">Confirm Delivery</h2>
            <button className="w-[300px] flex items-center bg-[#1DBF73] text-white py-2 justify-center font-bold text-lg relative rounded" onClick={confirmDelivery}>Confirm Delivery</button>
          </div>}

          {gigData.userId !== userInfo.id && (
            <div className="flex items-center justify-center mt-5">
              <button className=" w-5/6 hover:bg-[#74767e] py-1 border border-[#74767e] px-5 text-[#6c6d75] hover:text-white transition-all duration-300 text-lg rounded font-bold">
                Contact Me
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default Pricing;
