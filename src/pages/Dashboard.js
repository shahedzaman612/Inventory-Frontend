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

  // ---------------- Modals ----------------
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");
  const [addItemError, setAddItemError] = useState("");

  // ---------------- Inventory States ----------------
  const [modalInventory, setModalInventory] = useState({
    title: "",
    description: "",
    category: "",
    customFields: { stringFields: [], numberFields: [], booleanFields: [], dropdownFields: [] },
  });
  const [editInventory, setEditInventory] = useState({
    _id: "",
    title: "",
    description: "",
    category: "",
    customFields: { stringFields: [], numberFields: [], booleanFields: [], dropdownFields: [] },
  });

  // ---------------- Custom Field Temp States ----------------
  const [tempString, setTempString] = useState("");
  const [tempNumber, setTempNumber] = useState("");
  const [tempBoolean, setTempBoolean] = useState("");
  const [tempDropdown, setTempDropdown] = useState("");

  // ---------------- Add Item States ----------------
  const [addItemInventoryId, setAddItemInventoryId] = useState("");
  const [newItem, setNewItem] = useState({ name: "", quantity: 0, itemId: "" });

  // ---------------- Fetch inventories & stats ----------------
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

  // ---------------- Helper: Add Custom Field ----------------
  const addField = (inventory, setInventory, type, value, resetValue) => {
    if (value === "" || value === null || value === undefined) return;
    setInventory({
      ...inventory,
      customFields: {
        ...inventory.customFields,
        [type]: [...inventory.customFields[type], value],
      },
    });
    resetValue("");
  };

  // ---------------- Create Inventory Handlers ----------------
  const handleCreateModalShow = () => {
    setShowCreateModal(true);
    setModalInventory({
      title: "",
      description: "",
      category: "",
      customFields: { stringFields: [], numberFields: [], booleanFields: [], dropdownFields: [] },
    });
    setTempString("");
    setTempNumber("");
    setTempBoolean("");
    setTempDropdown("");
  };
  const handleCreateModalClose = () => setShowCreateModal(false);

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
      setCreateError(err.response?.data?.message || "Failed to create inventory");
    }
  };

  // ---------------- Edit Inventory Handlers ----------------
  const handleEditShow = (inventory) => {
    setEditInventory({
      _id: inventory._id,
      title: inventory.title,
      description: inventory.description,
      category: inventory.category,
      customFields: {
        stringFields: inventory.customFields?.stringFields || [],
        numberFields: inventory.customFields?.numberFields || [],
        booleanFields: inventory.customFields?.booleanFields || [],
        dropdownFields: inventory.customFields?.dropdownFields || [],
      },
    });
    setTempString("");
    setTempNumber("");
    setTempBoolean("");
    setTempDropdown("");
    setShowEditModal(true);
  };
  const handleEditClose = () => setShowEditModal(false);

  const handleEditSubmit = async () => {
    setEditError("");
    if (!editInventory.title) {
      setEditError("Title is required");
      return;
    }
    try {
      const res = await api.put(`/inventories/${editInventory._id}`, editInventory);
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
    if (!window.confirm("Are you sure you want to delete this inventory?")) return;
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
    setNewItem({ name: "", quantity: 0, itemId: "" });
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
      if (!newItem.itemId) newItem.itemId = Date.now().toString();
      await api.post(`/inventories/${addItemInventoryId}/items`, newItem);
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

      {/* Stats */}
      <Row className="mb-4">
        <Col md={6}>
          <Card bg="primary" text="white" className="mb-3">
            <Card.Body>
              <Card.Title>Total Inventories</Card.Title>
              <h3>{stats.inventories}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card bg="success" text="white" className="mb-3">
            <Card.Body>
              <Card.Title>Total Items</Card.Title>
              <h3>{stats.items}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Inventory Button */}
      <Row className="mb-3">
        <Col className="text-end">
          <Button variant="primary" onClick={handleCreateModalShow}>
            + Create Inventory
          </Button>
        </Col>
      </Row>

      {/* Inventories Table */}
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
                <tr key={inv._id}>
                  <td>{inv.title}</td>
                  <td>{inv.category}</td>
                  <td>{inv.description}</td>
                  <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Button
                      variant="success"
                      size="sm"
                      className="me-2"
                      onClick={() => handleAddItemShow(inv._id)}
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
                    {(inv.userId?._id === user.id || user.role === "admin") && (
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
                          onClick={() => handleDeleteInventory(inv._id)}
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

      {/* ---------------- Create Inventory Modal ---------------- */}
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
                  setModalInventory({ ...modalInventory, title: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Control
                type="text"
                value={modalInventory.category}
                onChange={(e) =>
                  setModalInventory({ ...modalInventory, category: e.target.value })
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
                  setModalInventory({ ...modalInventory, description: e.target.value })
                }
              />
            </Form.Group>

            <hr />
            <h6>Custom Fields</h6>

            {/* String Fields */}
            <Form.Group className="mb-3">
              <Form.Label>String Field</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  value={tempString}
                  onChange={(e) => setTempString(e.target.value)}
                />
                <Button
                  className="ms-2"
                  onClick={() =>
                    addField(modalInventory, setModalInventory, "stringFields", tempString, setTempString)
                  }
                >
                  Add
                </Button>
              </div>
              <ul>
                {modalInventory.customFields.stringFields.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </Form.Group>

            {/* Number Fields */}
            <Form.Group className="mb-3">
              <Form.Label>Number Field</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="number"
                  value={tempNumber}
                  onChange={(e) => setTempNumber(e.target.value)}
                />
                <Button
                  className="ms-2"
                  onClick={() =>
                    addField(modalInventory, setModalInventory, "numberFields", Number(tempNumber), setTempNumber)
                  }
                >
                  Add
                </Button>
              </div>
              <ul>
                {modalInventory.customFields.numberFields.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </Form.Group>

            {/* Boolean Fields */}
            <Form.Group className="mb-3">
              <Form.Label>Boolean Field</Form.Label>
              <div className="d-flex">
                <Form.Select value={tempBoolean} onChange={(e) => setTempBoolean(e.target.value)}>
                  <option value="">Select</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </Form.Select>
                <Button
                  className="ms-2"
                  onClick={() =>
                    addField(modalInventory, setModalInventory, "booleanFields", tempBoolean === "true", setTempBoolean)
                  }
                >
                  Add
                </Button>
              </div>
              <ul>
                {modalInventory.customFields.booleanFields.map((f, i) => (
                  <li key={i}>{f.toString()}</li>
                ))}
              </ul>
            </Form.Group>

            {/* Dropdown Fields */}
            <Form.Group className="mb-3">
              <Form.Label>Dropdown Field</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  value={tempDropdown}
                  onChange={(e) => setTempDropdown(e.target.value)}
                />
                <Button
                  className="ms-2"
                  onClick={() =>
                    addField(modalInventory, setModalInventory, "dropdownFields", tempDropdown, setTempDropdown)
                  }
                >
                  Add
                </Button>
              </div>
              <ul>
                {modalInventory.customFields.dropdownFields.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
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

      {/* ---------------- Edit Inventory Modal ---------------- */}
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
                  setEditInventory({ ...editInventory, category: e.target.value })
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

            <hr />
            <h6>Custom Fields</h6>

            {/* String Fields */}
            <Form.Group className="mb-3">
              <Form.Label>String Field</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  value={tempString}
                  onChange={(e) => setTempString(e.target.value)}
                />
                <Button
                  className="ms-2"
                  onClick={() =>
                    addField(editInventory, setEditInventory, "stringFields", tempString, setTempString)
                  }
                >
                  Add
                </Button>
              </div>
              <ul>
                {editInventory.customFields.stringFields.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </Form.Group>

            {/* Number Fields */}
            <Form.Group className="mb-3">
              <Form.Label>Number Field</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="number"
                  value={tempNumber}
                  onChange={(e) => setTempNumber(e.target.value)}
                />
                <Button
                  className="ms-2"
                  onClick={() =>
                    addField(editInventory, setEditInventory, "numberFields", Number(tempNumber), setTempNumber)
                  }
                >
                  Add
                </Button>
              </div>
              <ul>
                {editInventory.customFields.numberFields.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </Form.Group>

            {/* Boolean Fields */}
            <Form.Group className="mb-3">
              <Form.Label>Boolean Field</Form.Label>
              <div className="d-flex">
                <Form.Select value={tempBoolean} onChange={(e) => setTempBoolean(e.target.value)}>
                  <option value="">Select</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </Form.Select>
                <Button
                  className="ms-2"
                  onClick={() =>
                    addField(editInventory, setEditInventory, "booleanFields", tempBoolean === "true", setTempBoolean)
                  }
                >
                  Add
                </Button>
              </div>
              <ul>
                {editInventory.customFields.booleanFields.map((f, i) => (
                  <li key={i}>{f.toString()}</li>
                ))}
              </ul>
            </Form.Group>

            {/* Dropdown Fields */}
            <Form.Group className="mb-3">
              <Form.Label>Dropdown Field</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  value={tempDropdown}
                  onChange={(e) => setTempDropdown(e.target.value)}
                />
                <Button
                  className="ms-2"
                  onClick={() =>
                    addField(editInventory, setEditInventory, "dropdownFields", tempDropdown, setTempDropdown)
                  }
                >
                  Add
                </Button>
              </div>
              <ul>
                {editInventory.customFields.dropdownFields.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleEditClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditSubmit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ---------------- Add Item Modal ---------------- */}
      <Modal show={showAddItemModal} onHide={handleAddItemClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addItemError && <Alert variant="danger">{addItemError}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Item Name</Form.Label>
              <Form.Control
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleAddItemClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddItemSubmit}>
            Add Item
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Dashboard;
