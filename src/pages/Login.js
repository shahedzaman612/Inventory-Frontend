import { useState, useContext } from "react";
import { Form, Button, Container, Alert } from "react-bootstrap";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

//const API_URL = process.env.REACT_APP_API_URL;

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
    }
  };

  return (
    <Container className="mt-5" style={{ maxWidth: "400px" }}>
      <h2 className="mb-4 text-center">Login</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>

        <Button variant="primary" type="submit" className="w-100 mb-3">
          Login
        </Button>
      </Form>

      <div className="text-center mb-3">OR</div>

      <div className="d-grid gap-2 mb-3">
       <a href={`${process.env.REACT_APP_API_URL}/api/auth/google`} className="btn btn-outline-danger">
        Login/Register with Google
        </a>
        <a href={`${process.env.REACT_APP_API_URL}/api/auth/github`} className="btn btn-outline-dark">
        Login/Register with GitHub
        </a>
      </div>

      <div className="text-center mb-2">
        <Link to="/forgot-password">Forgot Password?</Link>
      </div>

      <p className="mt-3 text-center">
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </Container>
  );
};

export default Login;