import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Modal,
  Form,
  Alert,
} from "react-bootstrap";
import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [inventories, setInventories] = useState([]);
  const [stats, setStats] = useState({ inventories: 0, items: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ---------------- Create Inventory ----------------
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalInventory, setModalInventory] = useState({
    title: "",
    description: "",
    category: "",
  });
  const [createError, setCreateError] = useState("");

  // ---------------- Edit Inventory ----------------
  const [showEditModal, setShowEditModal] = useState(false);
  const [editInventory, setEditInventory] = useState({
    _id: "",
    title: "",
    description: "",
    category: "",
  });
  const [editError, setEditError] = useState("");

  // ---------------- Add Item ----------------
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemInventoryId, setAddItemInventoryId] = useState("");
  const [newItem, setNewItem] = useState({ name: "", quantity: 0 });
  const [addItemError, setAddItemError] = useState("");

  // Fetch inventories & stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const invRes = await api.get("/inventories");
        setInventories(invRes.data);
        const statsRes = await api.get("/inventories/stats");
        setStats(statsRes.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [user.id]);

  // ---------------- Create Inventory Handlers ----------------
  const handleCreateModalShow = () => setShowCreateModal(true);
  const handleCreateModalClose = () => {
    setShowCreateModal(false);
    setModalInventory({ title: "", description: "", category: "" });
    setCreateError("");
  };
  const handleCreateInventory = async () => {
    setCreateError("");
    if (!modalInventory.title) {
      setCreateError("Title is required");
      return;
    }
    try {
      const res = await api.post("/inventories", modalInventory);
      setInventories([res.data, ...inventories]);
      handleCreateModalClose();
    } catch (err) {
      setCreateError(
        err.response?.data?.message || "Failed to create inventory"
      );
    }
  };

  // ---------------- Edit Inventory Handlers ----------------
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

  // ---------------- Delete Inventory ----------------
  const handleDeleteInventory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this inventory?"))
      return;
    try {
      await api.delete(`/inventories/${id}`);
      setInventories(inventories.filter((inv) => inv._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete inventory");
    }
  };

  // ---------------- Add Item Handlers ----------------
  const handleAddItemShow = (inventoryId) => {
    setAddItemInventoryId(inventoryId);
    setNewItem({ name: "", quantity: 0 });
    setAddItemError("");
    setShowAddItemModal(true);
  };
  const handleAddItemClose = () => setShowAddItemModal(false);
  const handleAddItemSubmit = async () => {
    setAddItemError("");
    if (!newItem.name || newItem.quantity <= 0) {
      setAddItemError("Item name and positive quantity are required");
      return;
    }
    try {
      await api.post(`/inventories/${addItemInventoryId}/items`, {
        itemId: Date.now().toString(),
        name: newItem.name,
        quantity: newItem.quantity,
      });
      alert("Item added successfully");
      handleAddItemClose();
    } catch (err) {
      setAddItemError(err.response?.data?.message || "Failed to add item");
    }
  };

  if (loading) return <Container className="mt-5">Loading...</Container>;

  return (
    <Container className="mt-4">
      <Row className="mb-3">
        <Col>
          <h2>Welcome, {user.username}</h2>
        </Col>
        <Col className="text-end">
          <Button variant="secondary" onClick={logout}>
            Logout
          </Button>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Inventories</Card.Title>
              <h3>{stats.inventories}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Items</Card.Title>
              <h3>{stats.items}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col className="text-end">
          <Button variant="primary" onClick={handleCreateModalShow}>
            + Create Inventory
          </Button>
        </Col>
      </Row>

      <Row>
        {inventories.length === 0 ? (
          <p>No inventories found.</p>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Description</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventories.map((inv) => (
                <tr key={inv?._id}>
                  <td>{inv?.title}</td>
                  <td>{inv?.category}</td>
                  <td>{inv?.description}</td>
                  <td>{new Date(inv?.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Button
                      variant="success"
                      size="sm"
                      className="me-2"
                      onClick={() => handleAddItemShow(inv?._id)}
                    >
                      Add Item
                    </Button>
                    <Button
                      variant="info"
                      size="sm"
                      className="me-2"
                      onClick={() => navigate(`/inventory/${inv._id}`)}
                    >
                      View Details
                    </Button>

                    {(inv?.userId?._id === user.id ||
                      user.role === "admin") && (
                      <>
                        <Button
                          variant="warning"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEditShow(inv)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteInventory(inv?._id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Row>

      {/* Create Inventory Modal */}
      <Modal show={showCreateModal} onHide={handleCreateModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Create Inventory</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {createError && <Alert variant="danger">{createError}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={modalInventory.title}
                onChange={(e) =>
                  setModalInventory({
                    ...modalInventory,
                    title: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Control
                type="text"
                value={modalInventory.category}
                onChange={(e) =>
                  setModalInventory({
                    ...modalInventory,
                    category: e.target.value,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={modalInventory.description}
                onChange={(e) =>
                  setModalInventory({
                    ...modalInventory,
                    description: e.target.value,
                  })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCreateModalClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateInventory}>
            Create
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Inventory Modal */}
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
              <Form.Label>Category</Form.Label>
              <Form.Control
                type="text"
                value={editInventory.category}
                onChange={(e) =>
                  setEditInventory({
                    ...editInventory,
                    category: e.target.value,
                  })
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
                  setEditInventory({
                    ...editInventory,
                    description: e.target.value,
                  })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleEditClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditSubmit}>
            Update
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Item Modal */}
      <Modal show={showAddItemModal} onHide={handleAddItemClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addItemError && <Alert variant="danger">{addItemError}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Item ID</Form.Label>
              <Form.Control
                type="text"
                value={newItem.itemId}
                onChange={(e) =>
                  setNewItem({ ...newItem, itemId: e.target.value })
                }
                placeholder="Enter unique Item ID or leave blank to auto-generate"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Item Name</Form.Label>
              <Form.Control
                type="text"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                value={newItem.quantity}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    quantity: parseInt(e.target.value, 10),
                  })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleAddItemClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!newItem.itemId) {
                // Auto-generate ID if empty
                setNewItem({ ...newItem, itemId: Date.now().toString() });
              }
              handleAddItemSubmit();
            }}
          >
            Add Item
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Dashboard;
