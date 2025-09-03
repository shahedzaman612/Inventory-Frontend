import { useEffect, useState, useContext } from "react"; 
import {
  Container,
  Row,
  Col,
  Table,
  Button,
  Modal,
  Form,
  Alert,
} from "react-bootstrap";
import { useParams} from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext";

const InventoryDetail = () => {
  const { inventoryId } = useParams();
  const { user, token } = useContext(AuthContext);

  // Hooks at top
  const [inventory, setInventory] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalItem, setModalItem] = useState({
    _id: "",
    itemId: "",
    name: "",
    quantity: "",
    customFields: {},
  });
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    item: null,
  });

  const canEditOrDeleteItems =
    inventory?.userId?._id === user.id || user.role === "admin";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const invRes = await api.get(`/inventories/${inventoryId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInventory(invRes.data);

        const itemsRes = await api.get(`/inventories/${inventoryId}/items`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems(itemsRes.data);

        setLoading(false);
      } catch (err) {
        console.error("Fetch Inventory Error:", err);
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [inventoryId, token]);

  // Modal handlers
  const handleModalClose = () => {
    setShowModal(false);
    setModalItem({ _id: "", itemId: "", name: "", quantity: "", customFields: {} });
    setError("");
    setEditMode(false);
  };

  const handleModalShow = (item = null) => {
    if (item) {
      setModalItem({
        _id: item._id,
        itemId: item.itemId,
        name: item.name,
        quantity: item.quantity,
        customFields: item.customFields || {},
      });
      setEditMode(true);
    }
    setShowModal(true);
  };

  const handleSaveItem = async () => {
    setError("");
    if (!modalItem.itemId || !modalItem.name || modalItem.quantity === "") {
      setError("All fields are required");
      return;
    }
    try {
      if (editMode) {
        const res = await api.put(
          `/inventories/${inventoryId}/items/${modalItem._id}`,
          modalItem,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setItems(items.map((i) => (i._id === modalItem._id ? res.data : i)));
      } else {
        const res = await api.post(
          `/inventories/${inventoryId}/items`,
          modalItem,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setItems([res.data, ...items]);
      }
      handleModalClose();
    } catch (err) {
      console.error("Save Item Error:", err);
      setError(err.response?.data?.message || "Failed to save item");
    }
  };

  const handleDeleteItem = async (_id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/inventories/${inventoryId}/items/${_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(items.filter((i) => i._id !== _id));
    } catch (err) {
      console.error("Delete Item Error:", err);
    }
  };

  // Hide context menu on any click outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) setContextMenu({ ...contextMenu, visible: false });
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [contextMenu]);

  if (loading) return <Container className="mt-5">Loading...</Container>;

  return (
    <Container className="mt-4">
      <Row className="mb-3">
        <Col>
          <h2>Inventory: {inventory?.title}</h2>
          <p>Category: {inventory?.category}</p>
          <p>Description: {inventory?.description}</p>

          {inventory?.customFields && (
            <div className="mt-3">
              <h5>Custom Fields</h5>
              <ul>
                {Object.entries(inventory.customFields).map(([type, fields]) =>
                  fields.map((field, idx) => (
                    <li key={`${type}-${idx}`}>
                      {type}: {field}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </Col>
      </Row>

      <Row className="mb-3">
        <Col className="text-end">
          <Button variant="primary" onClick={() => handleModalShow()}>
            + Add Item
          </Button>
        </Col>
      </Row>

      <Row>
        {items.length === 0 ? (
          <p>No items in this inventory.</p>
        ) : (
          <>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Item ID</th>
                  <th>Name</th>
                  <th>Quantity</th>
                  {inventory?.customFields &&
                    Object.values(inventory.customFields).flat().map((field) => (
                      <th key={field}>{field}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item._id}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleModalShow(item)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (canEditOrDeleteItems) {
                        setContextMenu({
                          visible: true,
                          x: e.pageX,
                          y: e.pageY,
                          item,
                        });
                      }
                    }}
                  >
                    <td>{item.itemId}</td>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    {inventory?.customFields &&
                      Object.values(inventory.customFields).flat().map((field) => (
                        <td key={field}>{item.customFields?.[field] || "-"}</td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Right-click context menu */}
            {contextMenu.visible && (
              <div
                style={{
                  position: "absolute",
                  top: contextMenu.y,
                  left: contextMenu.x,
                  background: "white",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  zIndex: 1000,
                  width: "120px",
                }}
              >
                <div
                  style={{ padding: "8px", cursor: "pointer" }}
                  onClick={() => {
                    handleModalShow(contextMenu.item);
                    setContextMenu({ ...contextMenu, visible: false });
                  }}
                >
                  Edit
                </div>
                <div
                  style={{ padding: "8px", cursor: "pointer", color: "red" }}
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this item?")) {
                      handleDeleteItem(contextMenu.item._id);
                    }
                    setContextMenu({ ...contextMenu, visible: false });
                  }}
                >
                  Delete
                </div>
              </div>
            )}
          </>
        )}
      </Row>

      {/* Add/Edit Item Modal */}
      <Modal show={showModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? "Edit Item" : "Add Item"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Item ID</Form.Label>
              <Form.Control
                type="text"
                value={modalItem.itemId}
                onChange={(e) =>
                  setModalItem({ ...modalItem, itemId: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={modalItem.name}
                onChange={(e) =>
                  setModalItem({ ...modalItem, name: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                value={modalItem.quantity}
                onChange={(e) =>
                  setModalItem({ ...modalItem, quantity: e.target.value })
                }
              />
            </Form.Group>

            {inventory?.customFields &&
              Object.values(inventory.customFields).flat().map((field) => (
                <Form.Group className="mb-3" key={field}>
                  <Form.Label>{field}</Form.Label>
                  <Form.Control
                    type="text"
                    value={modalItem.customFields?.[field] || ""}
                    onChange={(e) =>
                      setModalItem({
                        ...modalItem,
                        customFields: {
                          ...modalItem.customFields,
                          [field]: e.target.value,
                        },
                      })
                    }
                  />
                </Form.Group>
              ))}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveItem}>
            {editMode ? "Update" : "Add"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default InventoryDetail;
