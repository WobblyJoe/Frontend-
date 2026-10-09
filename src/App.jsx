
import { useEffect, useState } from "react";
import {
  Wallet,
  Users,
  Plus,
  ArrowRight,
  Receipt,
  RefreshCw,
  Trash2,
  X,
  IndianRupee,
} from "lucide-react";
import { api } from "./api";
import "./App.css";

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format((Number(value) || 0) / 100);
}

export default function App() {
  const [groups, setGroups] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState("");
  const [busy, setBusy] = useState(false);

  const [groupName, setGroupName] = useState("");
  const [memberNames, setMemberNames] = useState(["", ""]);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Food");
  const [paidBy, setPaidBy] = useState("");
  const [splitBetween, setSplitBetween] = useState([]);

  async function loadGroups(preferredId = selectedId) {
    setLoading(true);
    setError("");

    try {
      const data = await api.getGroups();
      const list = Array.isArray(data) ? data : data.groups || [];
      setGroups(list);

      const nextId =
        list.find((group) => String(group.id) === String(preferredId))?.id ??
        list[0]?.id ??
        null;

      setSelectedId(nextId);

      if (nextId !== null) {
        const detail = await api.getGroup(nextId);
        setSelectedGroup(detail);
      } else {
        setSelectedGroup(null);
      }
    } catch (err) {
      setError(err.message || "Couldn't connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshGroup(id = selectedId) {
    if (id == null) return;
    try {
      const detail = await api.getGroup(id);
      setSelectedGroup(detail);
      setGroups((previous) =>
        previous.map((group) =>
          String(group.id) === String(id) ? detail : group
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadGroups(null);
  }, []);

  function selectGroup(id) {
    setSelectedId(id);
    setError("");
    setNotice("");
    refreshGroup(id);
  }

  async function createGroup(event) {
    event.preventDefault();

    const members = memberNames.map((name) => name.trim()).filter(Boolean);

    if (!groupName.trim()) {
      setError("Give your group a name.");
      return;
    }

    if (members.length < 2) {
      setError("Add at least two members.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const result = await api.createGroup({
        name: groupName.trim(),
        members,
      });

      const group = result.group || result;
      setGroupName("");
      setMemberNames(["", ""]);
      setModal("");
      setNotice("Your group is ready!");
      await loadGroups(group.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function addMemberField() {
    setMemberNames((previous) => [...previous, ""]);
  }

  function updateMember(index, value) {
    setMemberNames((previous) =>
      previous.map((name, i) => (i === index ? value : name))
    );
  }

  function openExpenseModal() {
    if (!selectedGroup) return;

    const members = selectedGroup.members || [];
    setExpenseTitle("");
    setExpenseAmount("");
    setExpenseCategory("Food");
    setPaidBy(members[0] ? String(members[0].id) : "");
    setSplitBetween(members.map((member) => String(member.id)));
    setModal("expense");
  }

  async function createExpense(event) {
    event.preventDefault();

    const amount = Number(expenseAmount);

    if (!expenseTitle.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError("Enter an expense name and a valid amount.");
      return;
    }

    if (!paidBy || splitBetween.length === 0) {
      setError("Choose who paid and who should split the expense.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await api.addExpense(selectedId, {
        title: expenseTitle.trim(),
        amount: Math.round(amount * 100),
        category: expenseCategory,
        paidBy: Number(paidBy),
        splitBetween: splitBetween.map(Number),
      });

      setModal("");
      setNotice("Expense added successfully!");
      await loadGroups(selectedId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteExpense(expenseId) {
    if (!window.confirm("Delete this expense?")) return;

    try {
      await api.deleteExpense(selectedId, expenseId);
      setNotice("Expense deleted.");
      await loadGroups(selectedId);
    } catch (err) {
      setError(err.message);
    }
  }

  const members = selectedGroup?.members || [];
  const expenses = selectedGroup?.expenses || [];
  const settlements = selectedGroup?.settlements || [];
  const categories = selectedGroup?.categories || {};
  const totalSpent = expenses.reduce(
    (sum, expense) => sum + (Number(expense.amount) || 0),
    0
  );

  function memberName(id) {
    return members.find((member) => String(member.id) === String(id))?.name
      || "Unknown member";
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => event.preventDefault()}>
          <span className="brand-icon"><Wallet size={23} /></span>
          <span>Splitwise<span className="brand-dot">.</span></span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>
        <button className="nav-item active">
          <Receipt size={18} /> Overview
        </button>

        <div className="sidebar-heading">
          <span>YOUR GROUPS</span>
          <button
            className="icon-button small"
            title="Create group"
            onClick={() => setModal("group")}
          >
            <Plus size={17} />
          </button>
        </div>

        <div className="group-list">
          {groups.map((group) => (
            <button
              key={group.id}
              className={`group-item ${
                String(group.id) === String(selectedId) ? "selected" : ""
              }`}
              onClick={() => selectGroup(group.id)}
            >
              <span className="group-avatar">
                {(group.name || "G").charAt(0).toUpperCase()}
              </span>
              <span className="group-item-text">
                <span>{group.name}</span>
                <small>{(group.members || []).length} members</small>
              </span>
            </button>
          ))}
          {groups.length === 0 && !loading && (
            <p className="sidebar-empty">Your groups will appear here.</p>
          )}
        </div>

        <button className="sidebar-create" onClick={() => setModal("group")}>
          <Plus size={18} /> Create a group
        </button>

        <div className="sidebar-footer">
          <div className="footer-avatar">₹</div>
          <div><strong>Expense Splitter</strong><small>Personal workspace</small></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">YOUR FINANCES, SIMPLIFIED</div>
            <h1>Overview</h1>
          </div>
          <button className="primary-button" onClick={() => setModal("group")}>
            <Plus size={18} /> New group
          </button>
        </header>

        {error && (
          <div className="alert error-alert">
            <span>{error}</span>
            <button onClick={() => setError("")}><X size={17} /></button>
          </div>
        )}
        {notice && (
          <div className="alert success-alert">
            <span>{notice}</span>
            <button onClick={() => setNotice("")}><X size={17} /></button>
          </div>
        )}

        {loading ? (
          <div className="empty-state">
            <RefreshCw className="spin" size={28} />
            <h2>Loading your workspace...</h2>
          </div>
        ) : (
          <>
            <section className="welcome-row">
              <div>
                <h2>Keep things fair, effortlessly.</h2>
                <p>Track shared expenses and settle up without the awkward maths.</p>
              </div>
              <div className="welcome-art"><Wallet size={38} /></div>
            </section>

            <section className="stats-grid">
              <article className="stat-card">
                <div className="stat-top">
                  <span>Total group spending</span>
                  <span className="stat-icon purple"><IndianRupee size={19} /></span>
                </div>
                <strong>{money(totalSpent)}</strong>
                <small>Across {expenses.length} expenses</small>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <span>Group members</span>
                  <span className="stat-icon blue"><Users size={19} /></span>
                </div>
                <strong>{members.length}</strong>
                <small>{selectedGroup ? selectedGroup.name : "No group selected"}</small>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <span>Expenses tracked</span>
                  <span className="stat-icon orange"><Receipt size={19} /></span>
                </div>
                <strong>{expenses.length}</strong>
                <small>Shared spending entries</small>
              </article>
            </section>

            {selectedGroup ? (
              <>
                <section className="section-heading">
                  <div>
                    <div className="eyebrow">YOUR SELECTED GROUP</div>
                    <h2>{selectedGroup.name}</h2>
                  </div>
                  <button className="primary-button" onClick={openExpenseModal}>
                    <Plus size={18} /> Add expense
                  </button>
                </section>

                <section className="content-grid">
                  <article className="panel expenses-panel">
                    <div className="panel-heading">
                      <div><h3>Recent expenses</h3><p>Every shared cost, all in one place.</p></div>
                      <button className="icon-button" onClick={() => refreshGroup()} title="Refresh">
                        <RefreshCw size={17} />
                      </button>
                    </div>

                    {expenses.length ? (
                      <div className="expense-list">
                        {expenses.map((expense) => (
                          <div className="expense-row" key={expense.id}>
                            <div className="expense-symbol">
                              <Receipt size={19} />
                            </div>
                            <div className="expense-info">
                              <strong>{expense.title}</strong>
                              <span>
                                {expense.category || "Other"} · Paid by {memberName(expense.paid_by)}
                              </span>
                            </div>
                            <div className="expense-amount">
                              <strong>{money(expense.amount)}</strong>
                              <button
                                className="delete-button"
                                title="Delete expense"
                                onClick={() => deleteExpense(expense.id)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="panel-empty">
                        <span className="empty-icon"><Receipt size={25} /></span>
                        <h3>No expenses yet</h3>
                        <p>Add your first shared expense to get started.</p>
                        <button className="secondary-button" onClick={openExpenseModal}>
                          <Plus size={16} /> Add an expense
                        </button>
                      </div>
                    )}
                  </article>

                  <article className="panel">
                    <div className="panel-heading">
                      <div><h3>Group members</h3><p>Everyone in this group.</p></div>
                      <span className="count-pill">{members.length}</span>
                    </div>

                    <div className="member-list">
                      {members.map((member, index) => (
                        <div className="member-row" key={member.id}>
                          <span className={`member-avatar avatar-${index % 5}`}>
                            {(member.name || "?").charAt(0).toUpperCase()}
                          </span>
                          <div className="member-info">
                            <strong>{member.name}</strong>
                            <small>{Number(member.balance) > 0 ? "Gets back" : Number(member.balance) < 0 ? "Owes" : "Settled up"}</small>
                          </div>
                          <strong className={`balance ${Number(member.balance) > 0 ? "positive" : Number(member.balance) < 0 ? "negative" : ""}`}>
                            {money(Math.abs(Number(member.balance) || 0))}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </article>
                </section>

                <section className="content-grid lower-grid">
                  <article className="panel">
                    <div className="panel-heading">
                      <div><h3>Settle up</h3><p>Suggested payments to balance things out.</p></div>
                    </div>
                    {settlements.length ? (
                      <div className="settlement-list">
                        {settlements.map((settlement, index) => (
                          <div className="settlement-row" key={`${settlement.from}-${settlement.to}-${index}`}>
                            <div className="settlement-people">
                              <strong>{memberName(settlement.from)}</strong>
                              <ArrowRight size={16} />
                              <strong>{memberName(settlement.to)}</strong>
                            </div>
                            <span>{money(settlement.amount)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="compact-empty">Everyone is settled up. Nice!</div>
                    )}
                  </article>

                  <article className="panel">
                    <div className="panel-heading">
                      <div><h3>Spending by category</h3><p>Where the money goes.</p></div>
                    </div>
                    {Object.keys(categories).length ? (
                      <div className="category-list">
                        {Object.entries(categories).map(([category, amount]) => {
                          const value = Number(amount) || 0;
                          const max = Math.max(...Object.values(categories).map(Number), 1);
                          return (
                            <div className="category-item" key={category}>
                              <div className="category-label">
                                <span>{category}</span><strong>{money(value)}</strong>
                              </div>
                              <div className="bar-track">
                                <div className="bar-fill" style={{ width: `${(value / max) * 100}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="compact-empty">Category insights appear after you add expenses.</div>
                    )}
                  </article>
                </section>
              </>
            ) : (
              <section className="panel first-group">
                <div className="welcome-art large"><Users size={42} /></div>
                <h2>Start your first group</h2>
                <p>Create a group with friends, roommates, or travel buddies and start splitting expenses.</p>
                <button className="primary-button" onClick={() => setModal("group")}>
                  <Plus size={18} /> Create your first group
                </button>
              </section>
            )}
          </>
        )}
      </main>

      {modal && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setModal("");
        }}>
          <section className="modal">
            <div className="modal-heading">
              <div>
                <div className="eyebrow">{modal === "group" ? "NEW WORKSPACE" : "SHARED SPENDING"}</div>
                <h2>{modal === "group" ? "Create a group" : "Add an expense"}</h2>
              </div>
              <button className="icon-button" onClick={() => setModal("")}><X size={19} /></button>
            </div>

            {modal === "group" ? (
              <form onSubmit={createGroup}>
                <label>Group name</label>
                <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Goa Trip" required />

                <div className="field-heading">
                  <label>Members</label>
                  <span>{memberNames.filter((name) => name.trim()).length} added</span>
                </div>
                {memberNames.map((name, index) => (
                  <input
                    key={index}
                    value={name}
                    onChange={(e) => updateMember(index, e.target.value)}
                    placeholder={`Member ${index + 1} name`}
                    className="member-input"
                  />
                ))}
                <button type="button" className="text-button" onClick={addMemberField}>
                  <Plus size={15} /> Add another member
                </button>
                <button className="primary-button form-submit" disabled={busy}>
                  {busy ? "Creating..." : "Create group"} <ArrowRight size={17} />
                </button>
              </form>
            ) : (
              <form onSubmit={createExpense}>
                <label>Expense name</label>
                <input value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)} placeholder="e.g. Dinner" required />

                <label>Amount (₹)</label>
                <input type="number" min="0.01" step="0.01" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="0.00" required />

                <label>Category</label>
                <select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}>
                  {["Food", "Travel", "Groceries", "Rent", "Entertainment", "Utilities", "Other"].map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>

                <label>Paid by</label>
                <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} required>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select>

                <label>Split equally between</label>
                <div className="split-options">
                  {members.map((member) => (
                    <label className="split-option" key={member.id}>
                      <input
                        type="checkbox"
                        checked={splitBetween.includes(String(member.id))}
                        onChange={(e) => setSplitBetween((previous) =>
                          e.target.checked
                            ? [...previous, String(member.id)]
                            : previous.filter((id) => id !== String(member.id))
                        )}
                      />
                      <span>{member.name}</span>
                    </label>
                  ))}
                </div>

                <button className="primary-button form-submit" disabled={busy}>
                  {busy ? "Saving..." : "Save expense"} <ArrowRight size={17} />
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
