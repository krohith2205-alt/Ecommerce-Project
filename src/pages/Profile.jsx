
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../services/api";
import { useCurrency } from "../context/CurrencyContext";

function Profile() {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  // =========================================
  // 1. READ USER SESSION SAFELY
  // =========================================

  const [storedUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  // =========================================
  // 2. PROFILE STATE
  // =========================================

  const [profile, setProfile] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    role: "user",
    loyaltyPoints: 0,
    addresses: []
  });

  const [newAddress, setNewAddress] = useState({
    label: "Home",
    street: "",
    city: "",
    state: "",
    zip: ""
  });

  // Loading and submission states
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const [error, setError] = useState("");

  // =========================================
  // 3. LOAD PROFILE
  // =========================================

  useEffect(() => {
    if (!storedUser?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchUserProfile() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/users/${storedUser.id}`);

        if (cancelled) return;

        const userData = response.data;

        setProfile({
          id: userData.id,
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          role: userData.role || "user",
          loyaltyPoints: Number(userData.loyaltyPoints) || 0,
          addresses: Array.isArray(userData.addresses)
            ? userData.addresses
            : []
        });
      } catch (err) {
        console.error("Profile loading error:", err);

        if (!cancelled) {
          setError("Unable to load your profile. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchUserProfile();

    return () => {
      cancelled = true;
    };
  }, [storedUser?.id]);

  // =========================================
  // 4. UPDATE LOCAL SESSION
  // =========================================

  function updateLocalSession(userData) {
    // Never store the password in the browser session object.
    const safeUser = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      phone: userData.phone || "",
      loyaltyPoints: Number(userData.loyaltyPoints) || 0
    };

    localStorage.setItem("user", JSON.stringify(safeUser));
  }

  // =========================================
  // 5. PROFILE INPUT HANDLER
  // =========================================

  function handleProfileChange(event) {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  // =========================================
  // 6. UPDATE PERSONAL INFORMATION
  // =========================================

  async function handleUpdateProfile(event) {
    event.preventDefault();

    if (!storedUser?.id) {
      toast.error("Please login to update your profile.");
      navigate("/login");
      return;
    }

    const name = profile.name.trim();
    const email = profile.email.trim().toLowerCase();
    const phone = profile.phone.trim();

    if (!name || !email) {
      toast.warning("Name and email are required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.warning("Please enter a valid email address.");
      return;
    }

    if (phone && !/^[0-9+\-\s()]{7,15}$/.test(phone)) {
      toast.warning("Please enter a valid phone number.");
      return;
    }

    try {
      setSavingProfile(true);

      // Fetch latest data to preserve addresses and loyalty points.
      const currentResponse = await api.get(`/users/${storedUser.id}`);
      const currentUser = currentResponse.data;

      const updatedUser = {
        ...currentUser,
        name,
        email,
        phone
      };

      const response = await api.put(
        `/users/${storedUser.id}`,
        updatedUser
      );

      const savedUser = response.data;

      setProfile({
        id: savedUser.id,
        name: savedUser.name || "",
        email: savedUser.email || "",
        phone: savedUser.phone || "",
        role: savedUser.role || "user",
        loyaltyPoints: Number(savedUser.loyaltyPoints) || 0,
        addresses: Array.isArray(savedUser.addresses)
          ? savedUser.addresses
          : []
      });

      updateLocalSession(savedUser);

      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  // =========================================
  // 7. ADDRESS INPUT HANDLER
  // =========================================

  function handleAddressChange(event) {
    const { name, value } = event.target;

    setNewAddress((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  // =========================================
  // 8. ADD SHIPPING ADDRESS
  // =========================================

  async function handleAddAddress(event) {
    event.preventDefault();

    if (!storedUser?.id) {
      toast.error("Please login first.");
      navigate("/login");
      return;
    }

    const address = {
      label: newAddress.label,
      street: newAddress.street.trim(),
      city: newAddress.city.trim(),
      state: newAddress.state.trim(),
      zip: newAddress.zip.trim()
    };

    if (!address.street || !address.city || !address.zip) {
      toast.warning("Street, city, and PIN/ZIP code are required.");
      return;
    }

    if (!/^[a-zA-Z0-9\s-]{3,12}$/.test(address.zip)) {
      toast.warning("Please enter a valid PIN/ZIP code.");
      return;
    }

    try {
      setAddingAddress(true);

      // Fetch latest user data to avoid overwriting other changes.
      const currentResponse = await api.get(`/users/${storedUser.id}`);
      const currentUser = currentResponse.data;

      const currentAddresses = Array.isArray(currentUser.addresses)
        ? currentUser.addresses
        : [];

      const addressToAdd = {
        ...address,
        id: crypto.randomUUID()
      };

      const updatedUser = {
        ...currentUser,
        addresses: [...currentAddresses, addressToAdd]
      };

      const response = await api.put(
        `/users/${storedUser.id}`,
        updatedUser
      );

      const savedUser = response.data;

      setProfile((previous) => ({
        ...previous,
        addresses: Array.isArray(savedUser.addresses)
          ? savedUser.addresses
          : []
      }));

      updateLocalSession(savedUser);

      setNewAddress({
        label: "Home",
        street: "",
        city: "",
        state: "",
        zip: ""
      });

      toast.success("Shipping address added successfully!");
    } catch (err) {
      console.error("Add address error:", err);
      toast.error("Failed to add address. Please try again.");
    } finally {
      setAddingAddress(false);
    }
  }

  // =========================================
  // 9. DELETE SHIPPING ADDRESS
  // =========================================

  async function handleDeleteAddress(addressId) {
    if (!storedUser?.id || deletingAddressId !== null) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this address?"
    );

    if (!confirmed) return;

    try {
      setDeletingAddressId(addressId);

      // Fetch latest user data before updating.
      const currentResponse = await api.get(`/users/${storedUser.id}`);
      const currentUser = currentResponse.data;

      const currentAddresses = Array.isArray(currentUser.addresses)
        ? currentUser.addresses
        : [];

      const updatedAddresses = currentAddresses.filter(
        (address) => String(address.id) !== String(addressId)
      );

      const updatedUser = {
        ...currentUser,
        addresses: updatedAddresses
      };

      const response = await api.put(
        `/users/${storedUser.id}`,
        updatedUser
      );

      const savedUser = response.data;

      setProfile((previous) => ({
        ...previous,
        addresses: Array.isArray(savedUser.addresses)
          ? savedUser.addresses
          : []
      }));

      updateLocalSession(savedUser);

      toast.success("Address deleted successfully!");
    } catch (err) {
      console.error("Delete address error:", err);
      toast.error("Failed to delete address.");
    } finally {
      setDeletingAddressId(null);
    }
  }

  // =========================================
  // 10. NOT LOGGED IN
  // =========================================

  if (!storedUser?.id && !loading) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h2>Please Login</h2>
          <p>You need to login to view your profile.</p>

          <Link to="/login" className="submit-btn">
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  // =========================================
  // 11. LOADING
  // =========================================

  if (loading) {
    return (
      <div className="profile-container">
        <p style={{ textAlign: "center", padding: "50px" }}>
          Loading Profile...
        </p>
      </div>
    );
  }

  // =========================================
  // 12. ERROR
  // =========================================

  if (error) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h2>Something went wrong</h2>
          <p>{error}</p>

          <button
            type="button"
            className="submit-btn"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =========================================
  // 13. PROFILE UI
  // =========================================

  return (
    <div className="profile-container">
      <h1 className="page-title">My Profile & Addresses</h1>

      <div className="profile-grid">

        {/* PERSONAL INFORMATION */}

        <div className="profile-card">
          <h2>👤 Personal Information</h2>

          <form onSubmit={handleUpdateProfile}>
            <label htmlFor="profile-name">Full Name</label>

            <input
              id="profile-name"
              type="text"
              name="name"
              placeholder="Full Name"
              value={profile.name}
              onChange={handleProfileChange}
              required
            />

            <label htmlFor="profile-email">Email Address</label>

            <input
              id="profile-email"
              type="email"
              name="email"
              placeholder="Email"
              value={profile.email}
              onChange={handleProfileChange}
              required
            />

            <label htmlFor="profile-phone">Phone Number</label>

            <input
              id="profile-phone"
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={profile.phone}
              onChange={handleProfileChange}
            />

            <p>
              Account Role: <strong>{profile.role}</strong>
            </p>

            <button
              type="submit"
              className="submit-btn"
              disabled={savingProfile}
            >
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        {/* LOYALTY POINTS */}

        <div className="profile-card">
          <h2>⭐ ShopSphere Rewards</h2>

          <div className="loyalty-points-badge-box">
            <span>Your Rewards Balance</span>

            <h2>
              {profile.loyaltyPoints} Points
            </h2>

            <small>
              Worth {formatPrice(profile.loyaltyPoints)} in discounts
              on your next purchase.
            </small>
          </div>

          <p>
            Earn 10% of your payable order amount as loyalty points
            when you place an order.
          </p>

          <Link to="/products" className="add-btn">
            Continue Shopping
          </Link>
        </div>

        {/* ADD SHIPPING ADDRESS */}

        <div className="profile-card">
          <h2>📍 Add Shipping Address</h2>

          <form onSubmit={handleAddAddress}>
            <label htmlFor="address-label">Address Type</label>

            <select
              id="address-label"
              name="label"
              value={newAddress.label}
              onChange={handleAddressChange}
            >
              <option value="Home">Home</option>
              <option value="Work">Work</option>
              <option value="Other">Other</option>
            </select>

            <label htmlFor="address-street">Street Address</label>

            <input
              id="address-street"
              type="text"
              name="street"
              placeholder="Street Address / Flat No."
              value={newAddress.street}
              onChange={handleAddressChange}
              required
            />

            <label htmlFor="address-city">City</label>

            <input
              id="address-city"
              type="text"
              name="city"
              placeholder="City"
              value={newAddress.city}
              onChange={handleAddressChange}
              required
            />

            <label htmlFor="address-state">State</label>

            <input
              id="address-state"
              type="text"
              name="state"
              placeholder="State"
              value={newAddress.state}
              onChange={handleAddressChange}
            />

            <label htmlFor="address-zip">PIN / ZIP Code</label>

            <input
              id="address-zip"
              type="text"
              name="zip"
              placeholder="PIN / ZIP Code"
              value={newAddress.zip}
              onChange={handleAddressChange}
              required
            />

            <button
              type="submit"
              className="submit-btn"
              disabled={addingAddress}
            >
              {addingAddress ? "Adding Address..." : "Add Address"}
            </button>
          </form>
        </div>
      </div>

      {/* SAVED ADDRESSES */}

      <div className="saved-addresses-section">
        <h2>
          Saved Addresses ({profile.addresses.length})
        </h2>

        {profile.addresses.length === 0 ? (
          <div className="profile-card">
            <p>No addresses saved yet.</p>
            <p>Add a shipping address above for faster checkout.</p>
          </div>
        ) : (
          <div className="address-list">
            {profile.addresses.map((address) => (
              <div
                key={address.id}
                className="address-card"
              >
                <span className="address-badge">
                  {address.label}
                </span>

                <p>
                  <strong>{address.street}</strong>
                </p>

                <p>
                  {address.city}
                  {address.state ? `, ${address.state}` : ""}
                  {" - "}
                  {address.zip}
                </p>

                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => handleDeleteAddress(address.id)}
                  disabled={deletingAddressId !== null}
                >
                  {String(deletingAddressId) === String(address.id)
                    ? "Deleting..."
                    : "Delete Address"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
