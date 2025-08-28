// src/pages/VerifyEmail.js
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const VerifyEmail = () => {
  const { token } = useParams();

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/auth/verify-email/${token}`
        );
        alert(res.data.message);
        // redirect to login page after success
        window.location.href = "/login";
      } catch (err) {
        alert(err.response?.data?.message || "Verification failed");
      }
    };
    verify();
  }, [token]);

  return <p>Verifying your email...</p>;
};

export default VerifyEmail;
