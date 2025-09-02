import React, { useEffect, useState, useContext } from "react"; 
import { AuthContext } from "../contexts/AuthContext";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { Card, Button, Row, Col, Container, Modal, Form, Alert } from "react-bootstrap";

const ProfilePage = () => {
  const { user, token } = useContext(AuthContext);
  const [inventories, setInventories] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const navigate = useNavigate();

  // ----- Edit Modal State -----
  const [showEditModal, setShowEditModal] = useState(false);
  const [editInventory, setEditInventory] = useState({
    _id: "",
    title: "",
    description: "",
    category: "",
  });
  const [editError, setEditError] = useState("");

  // ----- Create Modal State -----
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInventory, setNewInventory] = useState({
    title: "",
    description: "",
    category: "",
  });
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    const fetchInventories = async () => {
      try {
        const res = await api.get("/inventories/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInventories(res.data);

        // Calculate total items
        let itemCount = 0;
        for (const inv of res.data) {
          const itemsRes = await api.get(`/inventories/${inv._id}/items`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          itemCount += itemsRes.data.length;
        }
        setTotalItems(itemCount);
      } catch (err) {
        console.error("Error fetching inventories:", err);
      }
    };

    if (token) fetchInventories();
  }, [token]);

  // ----- Delete Inventory -----
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this inventory?")) {
      try {
        await api.delete(`/inventories/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInventories(inventories.filter((inv) => inv._id !== id));
      } catch (err) {
        console.error("Error deleting inventory:", err);
      }
    }
  };

  // ----- Edit Handlers -----
  const handleEditShow = (inventory) => {
    setEditInventory({
      _id: inventory._id,
      title: inventory.title,
      description: inventory.description,
      category: inventory.category,
    });
    setEditError("");
    setShowEditModal(true);
  };

  const handleEditClose = () => {
    setShowEditModal(false);
    setEditInventory({ _id: "", title: "", description: "", category: "" });
    setEditError("");
  };

  const handleEditSubmit = async () => {
    setEditError("");
    if (!editInventory.title) {
      setEditError("Title is required");
      return;
    }
    try {
      const res = await api.put(`/inventories/${editInventory._id}`, {
        title: editInventory.title,
        description: editInventory.description,
        category: editInventory.category,
      });
      setInventories(
        inventories.map((inv) => (inv._id === res.data._id ? res.data : inv))
      );
      handleEditClose();
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update inventory");
    }
  };

  // ----- Create Inventory Handlers -----
  const handleCreateModalShow = () => setShowCreateModal(true);
  const handleCreateModalClose = () => {
    setShowCreateModal(false);
    setNewInventory({ title: "", description: "", category: "" });
    setCreateError("");
  };

  const handleCreateInventory = async () => {
    setCreateError("");
    if (!newInventory.title) {
      setCreateError("Title is required");
      return;
    }
    try {
      const res = await api.post("/inventories", newInventory, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventories([res.data, ...inventories]);
      handleCreateModalClose();
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create inventory");
    }
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">{user?.username}’s Dashboard</h1>

      {/* --- Summary Cards --- */}
      <Row className="mb-4">
        <Col md={6}>
          <Card bg="primary" text="white" className="mb-3">
            <Card.Body>
              <Card.Title>Your Total Inventories</Card.Title>
              <Card.Text className="display-6">{inventories.length}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card bg="success" text="white" className="mb-3">
            <Card.Body>
              <Card.Title>Your Total Items</Card.Title>
              <Card.Text className="display-6">{totalItems}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* --- Create Inventory Button --- */}
      <Row className="mb-3">
        <Col className="text-end">
          <Button variant="primary" onClick={handleCreateModalShow}>
            + Create Inventory
          </Button>
        </Col>
      </Row>

      {/* --- Inventory List --- */}
      <h3 className="mb-3">My Inventories</h3>
      <Row xs={1} md={2} lg={3} className="g-4">
        {inventories.map((inv) => (
          <Col key={inv._id}>
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column">
                <Card.Title>{inv.title}</Card.Title>
                <Card.Text className="flex-grow-1">{inv.description}</Card.Text>
                <Card.Text className="text-muted mb-2">Category: {inv.category}</Card.Text>
                <Card.Text className="text-primary mb-3">Tags: {inv.tags.join(", ")}</Card.Text>
                <div className="d-flex justify-content-between mt-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/inventory/${inv._id}`)}
                  >
                    View
                  </Button>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => handleEditShow(inv)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(inv._id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ----- Edit Modal ----- */}
      <Modal show={showEditModal} onHide={handleEditClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Inventory</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editError && <Alert variant="danger">{editError}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={editInventory.title}
                onChange={(e) =>
                  setEditInventory({ ...editInventory, title: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editInventory.description}
                onChange={(e) =>
                  setEditInventory({ ...editInventory, description: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Control
                type="text"
                value={editInventory.category}
                onChange={(e) =>
                  setEditInventory({ ...editInventory, category: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleEditClose}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleEditSubmit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ----- Create Modal ----- */}
      <Modal show={showCreateModal} onHide={handleCreateModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Inventory</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {createError && <Alert variant="danger">{createError}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={newInventory.title}
                onChange={(e) =>
                  setNewInventory({ ...newInventory, title: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newInventory.description}
                onChange={(e) =>
                  setNewInventory({ ...newInventory, description: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Control
                type="text"
                value={newInventory.category}
                onChange={(e) =>
                  setNewInventory({ ...newInventory, category: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCreateModalClose}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleCreateInventory}>
            Create
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProfilePage;
