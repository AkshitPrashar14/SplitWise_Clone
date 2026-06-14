"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { 
  PlusCircle, Handshake, LogOut, ReceiptText, ArrowRight, 
  Settings, Users, Check, X, Menu, Sun, Moon, Palette, Waves
} from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [balances, setBalances] = useState<any>(null);
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // States
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
  const [isSettleModalOpen, setSettleModalOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  // Form States
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [settleToId, setSettleToId] = useState("");
  const [splitType, setSplitType] = useState("EQUAL");
  const [customSplits, setCustomSplits] = useState<{name: string, value: string, userId?: string}[]>([]);

  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [allGroups, setAllGroups] = useState<any[]>([]);

  const fetchBalances = async (groupIdToSelect?: string) => {
    try {
      const groupsRes = await fetch('/api/groups');
      const groups = await groupsRes.json();
      setAllGroups(groups);
      
      if (groups && groups.length > 0) {
        let selectedGroup = groups[0];
        if (groupIdToSelect) {
          selectedGroup = groups.find((g: any) => g.id === groupIdToSelect) || groups[0];
        }
        setGroup(selectedGroup);
        const balancesRes = await fetch(`/api/groups/${selectedGroup.id}/balances`);
        const data = await balancesRes.json();
        setBalances(data.simplifiedDebts);
      } else {
        setGroup(null);
        setBalances(null);
      }
    } catch (err) {
      console.error("Failed to fetch balances", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchBalances();
    }
  }, [status, router]);

  useEffect(() => {
    if (isExpenseModalOpen) {
      setCustomSplits([{ 
        name: (session?.user as any)?.name || "Me", 
        value: "",
        userId: (session?.user as any)?.id
      }]);
      setSplitType("EQUAL");
    }
  }, [isExpenseModalOpen, session]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const res = await fetch('/api/groups', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newGroupName,
        currency: 'INR',
        members: [] // Add self only
      })
    });
    const createdGroup = await res.json();
    setNewGroupName("");
    setIsCreatingGroup(false);
    fetchBalances(createdGroup.id);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    let computedSplits: any[] = [];
    const validSplits = customSplits.filter(s => s.name.trim() !== "");

    if (validSplits.length === 0) return alert("Add at least one person.");

    if (splitType === "EQUAL") {
      const splitAmount = parsedAmount / validSplits.length;
      computedSplits = validSplits.map(s => ({ name: s.name.trim(), amount: splitAmount, userId: s.userId }));
    } 
    else if (splitType === "EXACT") {
      let sum = 0;
      computedSplits = validSplits.map(s => {
        const val = parseFloat(s.value || "0");
        sum += val; return { name: s.name.trim(), amount: val, userId: s.userId };
      });
      if (Math.abs(sum - parsedAmount) > 0.01) return alert(`Amounts must sum to ${parsedAmount}`);
    } 
    else if (splitType === "PERCENTAGE") {
      let sum = 0;
      computedSplits = validSplits.map(s => {
        const pct = parseFloat(s.value || "0");
        sum += pct; return { name: s.name.trim(), amount: (parsedAmount * pct) / 100, percentage: pct, userId: s.userId };
      });
      if (Math.abs(sum - 100) > 0.01) return alert(`Percentages must sum to 100`);
    } 
    else if (splitType === "SHARE") {
      let totalShares = 0;
      validSplits.forEach(s => totalShares += parseFloat(s.value || "0"));
      if (totalShares === 0) return alert("Total shares cannot be zero.");
      computedSplits = validSplits.map(s => {
        const shares = parseFloat(s.value || "0");
        return { name: s.name.trim(), amount: (parsedAmount * shares) / totalShares, share: shares, userId: s.userId };
      });
    }

    await fetch(`/api/groups/${group.id}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, amount: parsedAmount, currency, paidById: (session?.user as any).id, splitType, splits: computedSplits })
    });

    setExpenseModalOpen(false);
    setDescription("");
    setAmount("");
    setCustomSplits([]);
    fetchBalances(group.id);
  };

  const handleSettleUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !settleToId) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    await fetch(`/api/groups/${group.id}/settlements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parsedAmount, currency, paidById: (session?.user as any).id, paidToId: settleToId })
    });

    setSettleModalOpen(false);
    setAmount("");
    setSettleToId("");
    fetchBalances(group.id);
  };

  if (status === "loading" || loading) return (
    <div className="flex h-screen items-center justify-center bg-bg-app">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="h-12 w-12 border-t-4 border-b-4 border-accent rounded-full" />
    </div>
  );

  const getMemberName = (id: string) => {
    if (!group) return id;
    const member = group.members.find((m: any) => m.user.id === id || m.user.name === id);
    return member ? member.user.name : id;
  };

  const themes = [
    { id: 'light', name: 'Light', icon: Sun },
    { id: 'dark', name: 'Dark', icon: Moon },
    { id: 'sunset', name: 'Sunset', icon: Palette },
    { id: 'oceanic', name: 'Oceanic', icon: Waves },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-bg-app text-text-primary transition-colors duration-300">
      
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="h-full bg-bg-card border-r border-border shadow-lg flex flex-col z-20 shrink-0 overflow-hidden backdrop-blur-xl bg-opacity-80"
      >
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <div className="bg-accent p-2.5 rounded-xl shadow-lg shadow-accent/20">
            <ReceiptText className="text-accent-foreground h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Splitwise</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 px-2">Your Groups</h2>
            <div className="space-y-1">
              {allGroups.map(g => (
                <button
                  key={g.id}
                  onClick={() => fetchBalances(g.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${group?.id === g.id ? 'bg-accent text-accent-foreground shadow-md shadow-accent/20 font-bold' : 'hover:bg-border/50 text-text-primary font-medium'}`}
                >
                  <Users className="h-5 w-5 opacity-70" />
                  <span className="truncate">{g.name}</span>
                </button>
              ))}
            </div>
            
            {isCreatingGroup ? (
              <form onSubmit={handleCreateGroup} className="mt-2 p-2 bg-border/30 rounded-xl">
                <input 
                  autoFocus
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="Group name..."
                  className="w-full bg-bg-card border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                />
                <div className="flex gap-2 mt-2">
                  <button type="submit" className="flex-1 bg-accent text-accent-foreground text-xs font-bold py-1.5 rounded-lg">Save</button>
                  <button type="button" onClick={() => setIsCreatingGroup(false)} className="flex-1 bg-transparent text-text-secondary hover:text-text-primary text-xs font-bold py-1.5 rounded-lg">Cancel</button>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => setIsCreatingGroup(true)}
                className="mt-2 w-full flex items-center gap-2 px-3 py-2.5 text-text-secondary hover:text-accent font-medium transition-colors"
              >
                <PlusCircle className="h-5 w-5" />
                Create New Group
              </button>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border space-y-2">
          <button 
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-border/50 text-text-secondary hover:text-text-primary transition-all font-medium"
          >
            <Settings className="h-5 w-5" />
            Settings
          </button>
          <button 
            onClick={() => fetch('/api/auth/signout', { method: 'POST' }).then(() => router.push('/login'))}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-500 transition-all font-medium"
          >
            <LogOut className="h-5 w-5" />
            Log Out
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-bg-app/80 backdrop-blur-md border-b border-border p-4 md:p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl bg-bg-card border border-border hover:border-accent transition text-text-secondary hover:text-accent"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">
              {group ? group.name : 'Select a Group'}
            </h2>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setExpenseModalOpen(true)}
              disabled={!group}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 md:px-6 py-2.5 rounded-full shadow-lg shadow-orange-500/20 font-bold hover:scale-105 hover:bg-orange-600 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              <PlusCircle className="h-5 w-5" />
              <span className="hidden md:inline">Add Expense</span>
            </button>
            <button 
              onClick={() => setSettleModalOpen(true)}
              disabled={!group}
              className="flex items-center gap-2 bg-accent text-accent-foreground px-4 md:px-6 py-2.5 rounded-full shadow-lg shadow-accent/20 font-bold hover:scale-105 hover:bg-accent-hover transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              <Handshake className="h-5 w-5" />
              <span className="hidden md:inline">Settle Up</span>
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-card shadow-2xl shadow-text-primary/5 rounded-3xl p-6 md:p-10 border border-border"
          >
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-text-primary">
              Who owes who?
            </h3>
            
            {!balances || Object.keys(balances).length === 0 ? (
              <div className="text-center py-16 bg-bg-app rounded-2xl border-2 border-dashed border-border">
                <div className="bg-bg-card w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Check className="h-8 w-8 text-accent" />
                </div>
                <h4 className="text-lg font-bold text-text-primary">You are all settled up!</h4>
                <p className="text-text-secondary mt-1">Add an expense to get started.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {Object.entries(balances).map(([curr, transactions]: [string, any]) => (
                  <div key={curr}>
                    {transactions.length > 0 && (
                      <motion.div layout className="grid gap-4 md:grid-cols-2">
                        {transactions.map((t: any, i: number) => (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            key={i} 
                            className="flex items-center p-5 bg-bg-app rounded-2xl border border-border hover:border-accent hover:shadow-lg hover:shadow-accent/5 transition-all group"
                          >
                            <div className="flex-1 flex flex-col gap-1">
                              <span className="font-bold text-red-500">{getMemberName(t.from)}</span>
                              <div className="flex items-center gap-2 text-text-secondary text-sm font-medium">
                                owes <ArrowRight className="h-4 w-4 text-border group-hover:text-accent transition-colors" /> {getMemberName(t.to)}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-2xl text-text-primary">
                                {curr === 'USD' ? '$' : '₹'}{(t.amount / 100).toFixed(2)}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Modals via AnimatePresence */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-text-primary/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-bg-card rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-border overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-text-primary">Add Expense</h2>
                <button onClick={() => setExpenseModalOpen(false)} className="p-2 bg-bg-app rounded-full text-text-secondary hover:text-text-primary transition"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleAddExpense} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-text-secondary mb-1.5">Description</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Dinner" className="w-full p-4 bg-bg-app border border-border rounded-2xl focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-text-primary" required />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-text-secondary mb-1.5">Amount</label>
                    <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full p-4 bg-bg-app border border-border rounded-2xl focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-text-primary" required />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-sm font-bold text-text-secondary mb-1.5">Currency</label>
                    <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full p-4 bg-bg-app border border-border rounded-2xl focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-text-primary">
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex bg-bg-app p-1 rounded-xl mb-4">
                    {['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARE'].map(type => (
                      <button key={type} type="button" onClick={() => setSplitType(type)} className={`flex-1 text-xs font-bold py-2.5 rounded-lg transition ${splitType === type ? 'bg-bg-card text-accent shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
                        {type}
                      </button>
                    ))}
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-3 pr-1 mb-3">
                    {customSplits.map((split, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input 
                          type="text" 
                          placeholder="Name" 
                          value={split.name} 
                          onChange={(e) => {
                            const newSplits = [...customSplits];
                            newSplits[index].name = e.target.value;
                            setCustomSplits(newSplits);
                          }} 
                          className="flex-1 p-3 bg-bg-card border border-border rounded-xl focus:border-accent outline-none text-text-primary text-sm font-bold" 
                          required 
                        />
                        {splitType !== "EQUAL" && (
                          <div className="flex items-center gap-2 w-32 relative">
                            <input 
                              type="number" 
                              step="0.01" 
                              placeholder="0" 
                              value={split.value} 
                              onChange={(e) => {
                                const newSplits = [...customSplits];
                                newSplits[index].value = e.target.value;
                                setCustomSplits(newSplits);
                              }} 
                              className="w-full text-right p-3 pr-8 text-sm bg-bg-card border border-border rounded-xl focus:border-accent outline-none text-text-primary font-bold" 
                              required 
                            />
                            <span className="absolute right-3 text-xs font-bold text-text-secondary">
                              {splitType === 'PERCENTAGE' ? '%' : splitType === 'SHARE' ? 'sh' : currency}
                            </span>
                          </div>
                        )}
                        {customSplits.length > 1 && (
                          <button type="button" onClick={() => setCustomSplits(customSplits.filter((_, i) => i !== index))} className="p-2 text-text-secondary hover:text-red-500 transition">
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => setCustomSplits([...customSplits, {name: "", value: ""}])} className="text-sm font-bold text-accent hover:text-accent-hover transition flex items-center gap-1">
                    <PlusCircle className="h-4 w-4" /> Add Person
                  </button>
                </div>

                <button type="submit" className="w-full mt-4 py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-1">Save Expense</button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {isSettleModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-text-primary/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-card rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-border"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-text-primary">Settle Up</h2>
                <button onClick={() => setSettleModalOpen(false)} className="p-2 bg-bg-app rounded-full text-text-secondary hover:text-text-primary transition"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleSettleUp} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-text-secondary mb-1.5">Who are you paying?</label>
                  <select value={settleToId} onChange={e => setSettleToId(e.target.value)} className="w-full p-4 bg-bg-app border border-border rounded-2xl focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-text-primary" required>
                    <option value="" disabled>Select a member...</option>
                    {group?.members?.filter((m: any) => m.user.id !== (session?.user as any).id).map((m: any) => (
                      <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-text-secondary mb-1.5">Amount Paid</label>
                    <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full p-4 bg-bg-app border border-border rounded-2xl focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-text-primary" required />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-sm font-bold text-text-secondary mb-1.5">Currency</label>
                    <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full p-4 bg-bg-app border border-border rounded-2xl focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-text-primary">
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full mt-4 py-4 bg-accent text-accent-foreground font-bold rounded-2xl hover:bg-accent-hover shadow-lg shadow-accent/25 transition-all hover:-translate-y-1">Record Payment</button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Settings Modal */}
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-text-primary/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-card rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-border"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-text-primary">Settings</h2>
                <button onClick={() => setSettingsOpen(false)} className="p-2 bg-bg-app rounded-full text-text-secondary hover:text-text-primary transition"><X className="h-5 w-5" /></button>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">App Theme</h3>
                <div className="grid grid-cols-2 gap-3">
                  {themes.map(t => {
                    const Icon = t.icon;
                    return (
                      <button 
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${theme === t.id ? 'border-accent bg-accent/10 text-accent font-bold' : 'border-border bg-bg-app text-text-secondary hover:border-accent/50 hover:text-text-primary'}`}
                      >
                        <Icon className="h-6 w-6" />
                        <span>{t.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
