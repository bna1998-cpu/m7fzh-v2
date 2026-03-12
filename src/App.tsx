/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, ChevronDown, PlusCircle, Plus, Trash2, Wallet, X, Calendar, ArrowUpRight, ArrowDownLeft, Hash, Tag, DollarSign, Layers, Percent, Eye, RefreshCw, ArrowRight, FileText, Download, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';

interface InvestmentOperation {
  id: string;
  date: string;
  serial: string;
  type: 'deposit' | 'withdraw';
  category: string;
  units: string;
  price: string;
  commission: string;
  actualValue: string;
  totalValue: string;
}

interface Account {
  id: string;
  name: string;
  amount: string;
  date: string;
  customerNumber: string;
  operations?: InvestmentOperation[];
}

export default function App() {
  const [currentView, setCurrentView] = useState<'accounts' | 'investments'>('accounts');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditDeleteModalOpen, setIsEditDeleteModalOpen] = useState(false);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceOpType, setBalanceOpType] = useState<'deposit' | 'withdraw'>('deposit');
  const [balanceValue, setBalanceValue] = useState('');
  const [editNameValue, setEditNameValue] = useState('');
  const [editNumberValue, setEditNumberValue] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('تم التعديل بنجاح');
  const [isSparkling, setIsSparkling] = useState(false);
  
  // Persistence Logic
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('accounts');
    const initialAccounts = saved ? JSON.parse(saved) : [];
    // Filter out the default account as requested by the user
    // And update any account starting with 100 to 101 as requested
    return initialAccounts
      .filter((acc: Account) => !(acc.customerNumber === '100' && acc.name === 'المحفظة الرئيسية (EGP)'))
      .map((acc: Account) => acc.customerNumber === '100' ? { ...acc, customerNumber: '101' } : acc);
  });
  
  const [nextCustomerNumber, setNextCustomerNumber] = useState(101);

  useEffect(() => {
    localStorage.setItem('accounts', JSON.stringify(accounts));
    
    // Smartly calculate the next customer number
    if (accounts.length === 0) {
      setNextCustomerNumber(101);
    } else {
      const nums = accounts.map(acc => parseInt(acc.customerNumber)).filter(n => !isNaN(n));
      const maxNum = Math.max(...nums, 100); // Ensure at least 101 is the next if empty-ish
      setNextCustomerNumber(maxNum + 1);
    }
  }, [accounts]);
  
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit/Delete State
  const [selectedEditId, setSelectedEditId] = useState('');
  const [selectedDeleteId, setSelectedDeleteId] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAccountDeleteConfirmOpen, setIsAccountDeleteConfirmOpen] = useState(false);
  const [operationToDeleteId, setOperationToDeleteId] = useState('');
  const [editingOperationId, setEditingOperationId] = useState('');

  // Investment Modal State
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [investmentAccount, setInvestmentAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (investmentAccount?.amount !== undefined) {
      setIsSparkling(true);
      const timer = setTimeout(() => setIsSparkling(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [investmentAccount?.amount]);

  // Investment Form State
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [invSerial, setInvSerial] = useState('1');
  const [invType, setInvType] = useState<'deposit' | 'withdraw'>('deposit');
  const [invCategory, setInvCategory] = useState('');
  const [invUnits, setInvUnits] = useState('');
  const [invPrice, setInvPrice] = useState('');
  const [invCommission, setInvCommission] = useState('');

  // Pull to refresh logic (Only for Accounts view)
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const REFRESH_THRESHOLD = 80;

  const resetInvestmentForm = (account?: Account | null) => {
    setInvDate(new Date().toISOString().split('T')[0]);
    setInvType('deposit');
    setInvCategory('');
    setInvUnits('');
    setInvPrice('');
    setInvCommission('');
    setEditingOperationId('');
    
    const targetAcc = account || investmentAccount;
    if (targetAcc) {
      const nextSerial = (targetAcc.operations?.length || 0) + 1;
      setInvSerial(nextSerial.toString());
    } else {
      setInvSerial('1');
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (currentView !== 'accounts') return;
    // Only allow pull-to-refresh if touch starts in the top half of the screen
    if (window.scrollY === 0 && e.touches[0].clientY < window.innerHeight / 2) {
      setStartY(e.touches[0].pageY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (currentView !== 'accounts' || startY === 0) return;
    const currentY = e.touches[0].pageY;
    const distance = currentY - startY;
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance, REFRESH_THRESHOLD + 20));
    }
  };

  const handleTouchEnd = () => {
    if (currentView === 'accounts' && pullDistance >= REFRESH_THRESHOLD) {
      setIsRefreshing(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    setPullDistance(0);
    setStartY(0);
  };

  const handleEnterAccount = () => {
    if (!selectedAccountId) return;
    const account = accounts.find(acc => acc.id === selectedAccountId);
    if (account) {
      sessionStorage.setItem('activeAccountName', account.name);
      setInvestmentAccount(account);
      setCurrentView('investments');
      resetInvestmentForm(account);
    }
  };

  const handleOpenEditNameModal = () => {
    if (!selectedEditId) return;
    const account = accounts.find(acc => acc.id === selectedEditId);
    if (account) {
      setEditNameValue(account.name);
      setEditNumberValue(account.customerNumber);
      setIsEditNameModalOpen(true);
      setIsEditDeleteModalOpen(false);
    }
  };

  const handleSaveEditName = () => {
    if (!selectedEditId) return;
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === selectedEditId) {
        return { 
          ...acc, 
          name: editNameValue
        };
      }
      return acc;
    });
    setAccounts(updatedAccounts);
    setIsEditNameModalOpen(false);
    setSelectedEditId('');
    setToastMessage('تم التعديل بنجاح');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const getPreviewBalance = () => {
    if (!investmentAccount) return '0.00';
    let currentAmount = parseFloat(investmentAccount.amount) || 0;
    
    if (editingOperationId) {
      const oldOp = investmentAccount.operations?.find(op => op.id === editingOperationId);
      if (oldOp) {
        const oldTotalValue = parseFloat(oldOp.totalValue);
        // Reverse logic
        if (oldOp.category === 'إضافة رصيد' || oldOp.category === 'إيداع نقدي') {
          currentAmount -= oldTotalValue;
        } else if (oldOp.category === 'سحب رصيد' || oldOp.category === 'سحب نقدي') {
          currentAmount += oldTotalValue;
        } else {
          currentAmount = oldOp.type === 'deposit' 
            ? currentAmount + oldTotalValue 
            : currentAmount - oldTotalValue;
        }
      }
    }
    
    const units = parseFloat(invUnits) || 0;
    const price = parseFloat(invPrice) || 0;
    const fees = parseFloat(invCommission) || 0;
    const actualValue = units * price;
    const totalValue = invType === 'deposit' ? actualValue + fees : actualValue - fees;
    
    const newAmount = invType === 'deposit' ? currentAmount - totalValue : currentAmount + totalValue;
    return newAmount.toFixed(2);
  };

  const handleSaveBalanceOp = () => {
    if (!selectedEditId) return;
    const opAmount = parseFloat(balanceValue) || 0;
    if (opAmount <= 0) return;

    const updatedAccounts = accounts.map(acc => {
      if (acc.id === selectedEditId) {
        const currentAmount = parseFloat(acc.amount) || 0;
        
        if (balanceOpType === 'withdraw' && opAmount > currentAmount) {
          alert('الرصيد غير كافٍ لإتمام عملية السحب');
          return acc;
        }

        let updatedOps = acc.operations || [];
        const newOp: InvestmentOperation = {
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
          serial: (updatedOps.length + 1).toString(),
          type: balanceOpType,
          category: balanceOpType === 'deposit' ? 'إضافة رصيد' : 'سحب رصيد',
          units: '1',
          price: opAmount.toString(),
          commission: '0',
          actualValue: opAmount.toString(),
          totalValue: opAmount.toString(),
        };
        updatedOps = [newOp, ...updatedOps];

        const newTotalAmount = balanceOpType === 'deposit' 
          ? currentAmount + opAmount 
          : currentAmount - opAmount;

        return { 
          ...acc, 
          amount: newTotalAmount.toFixed(2),
          operations: updatedOps
        };
      }
      return acc;
    });
    
    // Check if we actually updated (didn't hit the withdraw limit)
    const wasUpdated = updatedAccounts.some((acc, idx) => acc.amount !== accounts[idx].amount);
    if (wasUpdated) {
      setAccounts(updatedAccounts);
      setIsBalanceModalOpen(false);
      setBalanceValue('');
      if (investmentAccount && selectedEditId === investmentAccount.id) {
        setInvestmentAccount(updatedAccounts.find(acc => acc.id === selectedEditId) || null);
      }
    }
  };

  const handleSaveInvestment = () => {
    if (!investmentAccount) return;

    const units = parseFloat(invUnits) || 0;
    const price = parseFloat(invPrice) || 0;
    const purchaseFees = parseFloat(invCommission) || 0;
    
    const actualValue = units * price;
    let totalValue = 0;
    
    if (invType === 'deposit') {
      totalValue = actualValue + purchaseFees;
    } else {
      totalValue = actualValue - purchaseFees;
    }

    const newOperation: InvestmentOperation = {
      id: editingOperationId || Math.random().toString(36).substr(2, 9),
      date: invDate.replace(/-/g, '/'),
      serial: invSerial,
      type: invType,
      category: invCategory,
      units: invUnits,
      price: invPrice,
      commission: invCommission,
      actualValue: actualValue.toFixed(2),
      totalValue: totalValue.toFixed(2),
    };

    const updatedAccounts = accounts.map(acc => {
      if (acc.id === investmentAccount.id) {
        let currentAmount = parseFloat(acc.amount) || 0;
        
        // If editing, reverse the old operation's effect first
        if (editingOperationId) {
          const oldOp = acc.operations?.find(op => op.id === editingOperationId);
          if (oldOp) {
            const oldTotalValue = parseFloat(oldOp.totalValue);
            // Reverse logic: If it was deposit (Buy), it subtracted from balance, so add it back.
            // If it was withdraw (Sell), it added to balance, so subtract it.
            currentAmount = oldOp.type === 'deposit' 
              ? currentAmount + oldTotalValue 
              : currentAmount - oldTotalValue;
          }
        }

        // Apply the new/updated operation's effect
        const newAmount = invType === 'deposit' 
          ? currentAmount - totalValue 
          : currentAmount + totalValue;
        
        let existingOps = acc.operations || [];
        let updatedOps;
        if (editingOperationId) {
          updatedOps = existingOps.map(op => op.id === editingOperationId ? newOperation : op);
        } else {
          updatedOps = [newOperation, ...existingOps];
        }

        return { 
          ...acc, 
          amount: newAmount.toFixed(2),
          operations: updatedOps
        };
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    const updatedAcc = updatedAccounts.find(acc => acc.id === investmentAccount.id) || null;
    setInvestmentAccount(updatedAcc);
    setIsInvestmentModalOpen(false);
    resetInvestmentForm(updatedAcc);
    setCurrentView('investments');
    setToastMessage('تمت العملية');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleDeleteOperation = (operationId: string) => {
    if (!investmentAccount) return;
    
    const operationToDelete = investmentAccount.operations?.find(op => op.id === operationId);
    if (!operationToDelete) return;

    const totalValue = parseFloat(operationToDelete.totalValue);
    
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === investmentAccount.id) {
        const currentAmount = parseFloat(acc.amount) || 0;
        // Reverse the logic: 
        // If it was deposit (Buy), it subtracted from balance, so we add it back.
        // If it was withdraw (Sell), it added to balance, so we subtract it.
        const newAmount = operationToDelete.type === 'deposit' 
          ? currentAmount + totalValue 
          : currentAmount - totalValue;
        
        return {
          ...acc,
          amount: newAmount.toFixed(2),
          operations: acc.operations?.filter(op => op.id !== operationId) || []
        };
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    setInvestmentAccount(updatedAccounts.find(acc => acc.id === investmentAccount.id) || null);
    setIsDeleteConfirmOpen(false);
    setOperationToDeleteId('');
  };

  const handleViewDetails = (op: InvestmentOperation) => {
    setEditingOperationId(op.id);
    setInvDate(op.date.replace(/\//g, '-'));
    setInvSerial(op.serial);
    setInvType(op.type);
    setInvCategory(op.category);
    setInvUnits(op.units);
    setInvPrice(op.price);
    setInvCommission(op.commission);
    setIsInvestmentModalOpen(true);
  };

  const handleCreateAccount = () => {
    if (!customerName.trim()) return;

    const newAccount: Account = {
      id: Math.random().toString(36).substr(2, 9),
      name: customerName,
      amount: amount || '0.00',
      date: date.replace(/-/g, '/'),
      customerNumber: nextCustomerNumber.toString(),
    };

    setAccounts([...accounts, newAccount]);
    
    // Reset and Close
    setCustomerName('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsCreateModalOpen(false);
  };

  const handleDeleteAccount = () => {
    if (!selectedDeleteId) return;
    setIsAccountDeleteConfirmOpen(true);
  };

  const confirmDeleteAccount = () => {
    if (!selectedDeleteId) return;
    setAccounts(accounts.filter(acc => acc.id !== selectedDeleteId));
    setSelectedDeleteId('');
    setIsAccountDeleteConfirmOpen(false);
    setIsEditDeleteModalOpen(false);
  };

  return (
    <div 
      className="h-screen bg-slate-50 flex flex-col relative overflow-hidden" 
      dir="rtl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator (Only for Accounts view) */}
      {currentView === 'accounts' && (
        <div 
          className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none"
          style={{ 
            transform: `translateY(${pullDistance > 0 ? pullDistance - 40 : -40}px)`,
            opacity: pullDistance > 20 ? 1 : 0,
            transition: pullDistance === 0 ? 'transform 0.3s ease, opacity 0.3s ease' : 'none'
          }}
        >
          <div className="bg-white p-2 rounded-full shadow-xl border border-slate-100">
            <RefreshCw 
              className={`w-6 h-6 text-emerald-500 ${isRefreshing ? 'animate-spin' : ''}`} 
              style={{ transform: `rotate(${pullDistance * 2}deg)` }}
            />
          </div>
        </div>
      )}

      {/* Professional Header */}
      <header className="bg-slate-900 pt-6 pb-8 px-6 rounded-b-[2rem] shadow-lg relative overflow-hidden sticky top-0 z-30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        
        {currentView === 'investments' && (
          <button 
            onClick={() => setCurrentView('accounts')}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-40"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        )}

        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-emerald-500 p-2 rounded-xl mb-2 shadow-lg shadow-emerald-500/20">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {currentView === 'accounts' ? 'محفظة الاستثمار' : 'استثماراتي'}
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">إدارة محافظك الاستثمارية بذكاء</p>
        </div>
      </header>

      {/* Main Content Area */}
      {currentView === 'accounts' ? (
        <main className="flex-1 px-4 -mt-4 relative z-20 space-y-4 pb-24 overflow-y-auto custom-scrollbar">
          {/* Selection Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 shadow-xl shadow-slate-200/50 border border-slate-100"
          >
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 mr-1">
              اختر المحفظة المطلوبة
            </label>
            <div className="flex flex-col gap-3">
              <div className="relative group">
                <select
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer font-medium text-right text-sm"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                >
                  <option value="" disabled>اختر الحساب من القائمة...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>({acc.customerNumber}) {acc.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEnterAccount}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 text-sm"
              >
                دخول للحساب
              </motion.button>
            </div>
          </motion.div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button 
              whileHover={{ y: -2 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group"
            >
              <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-blue-100 transition-colors">
                <PlusCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-800 text-sm">إنشاء</p>
                <p className="text-[10px] text-slate-500">حساب جديد</p>
              </div>
            </motion.button>

            <motion.button 
              whileHover={{ y: -2 }}
              onClick={() => setIsEditDeleteModalOpen(true)}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group"
            >
              <div className="bg-rose-50 p-3 rounded-xl group-hover:bg-rose-100 transition-colors">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-800 text-sm">حذف / تعديل</p>
                <p className="text-[10px] text-slate-500">حساب موجود</p>
              </div>
            </motion.button>

            <motion.button 
              whileHover={{ y: -2 }}
              onClick={() => {
                setBalanceOpType('deposit');
                setSelectedEditId(selectedAccountId || '');
                setIsBalanceModalOpen(true);
              }}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group"
            >
              <div className="bg-emerald-50 p-3 rounded-xl group-hover:bg-emerald-100 transition-colors">
                <ArrowUpRight className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-800 text-sm">إضافة رصيد</p>
                <p className="text-[10px] text-slate-500">للحساب المختار</p>
              </div>
            </motion.button>

            <motion.button 
              whileHover={{ y: -2 }}
              onClick={() => {
                setBalanceOpType('withdraw');
                setSelectedEditId(selectedAccountId || '');
                setIsBalanceModalOpen(true);
              }}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group"
            >
              <div className="bg-amber-50 p-3 rounded-xl group-hover:bg-amber-100 transition-colors">
                <ArrowDownLeft className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-800 text-sm">سحب رصيد</p>
                <p className="text-[10px] text-slate-500">من الحساب المختار</p>
              </div>
            </motion.button>
          </div>
        </main>
      ) : (
        <main className="flex-1 px-6 -mt-6 relative z-20 flex flex-col overflow-hidden">
          {/* Fixed Top Section for Investments */}
          <div className="flex-none space-y-6 mb-4">
            {/* Investments Page Header */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">الرصيد المتبقي</p>
                  <h2 className={`text-4xl font-mono font-bold text-emerald-400 transition-all duration-300 ${isSparkling ? 'animate-sparkle' : ''}`}>
                    {investmentAccount?.amount} <span className="text-lg">EGP</span>
                  </h2>
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-bold">{investmentAccount?.name}</h3>
                  <p className="text-slate-400 text-sm">سجل الاستثمارات</p>
                </div>
              </div>
            </motion.div>

            <div className="flex items-center justify-center gap-4 py-3 bg-white/50 backdrop-blur-md rounded-[2rem] border border-white/80 shadow-sm mx-2">
              <motion.button 
                whileHover={{ scale: 1.02, x: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsStatementModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100/50 shadow-sm transition-all hover:shadow-md hover:bg-emerald-100/50"
              >
                <FileText className="w-4 h-4" />
                <span className="font-bold text-xs">كشف حساب</span>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  resetInvestmentForm();
                  setIsInvestmentModalOpen(true);
                }}
                className="w-12 h-12 bg-gradient-to-tr from-rose-500 to-pink-500 text-white rounded-full shadow-xl shadow-rose-500/30 flex items-center justify-center border-4 border-white ring-1 ring-rose-100"
              >
                <Plus className="w-6 h-6" />
              </motion.button>

              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-700 rounded-2xl border border-slate-100/50 shadow-sm">
                <Layers className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-xs">سجل الاستثمارات</span>
              </div>
            </div>
          </div>
          
          {/* Scrollable List Section */}
          <div className="flex-1 overflow-y-auto pb-32 px-1 py-1 -mx-1 scroll-smooth custom-scrollbar">
            <div className="space-y-3">
              {investmentAccount?.operations?.filter(op => op.category !== 'إضافة رصيد' && op.category !== 'سحب رصيد').length ? (
                investmentAccount.operations.filter(op => op.category !== 'إضافة رصيد' && op.category !== 'سحب رصيد').map((op) => (
                  <motion.div 
                    key={op.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center"
                  >
                    <div className="flex flex-col gap-1">
                      <h5 className="font-bold text-slate-900 text-lg">{op.category}</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">{op.date}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                            {op.type === 'deposit' ? 'شراء' : 'بيع'}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(op);
                            }}
                            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-500" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOperationToDeleteId(op.id);
                              setIsDeleteConfirmOpen(true);
                            }}
                            className="p-1 hover:bg-rose-50 rounded-full transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-800 font-black text-xl mt-1">
                        {op.actualValue} <span className="text-xs font-normal text-slate-400">EGP</span>
                      </p>
                    </div>
                    
                    <div className="text-left">
                      <div className={`px-4 py-2 rounded-2xl font-black text-sm ${op.type === 'deposit' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {op.type === 'deposit' ? '-' : '+'}{op.totalValue}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 text-center uppercase tracking-tighter">
                        {op.type === 'deposit' ? 'المكسب/الخسارة' : 'المكسب/الخسارة'}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-slate-200">
                  <p className="text-slate-400">لا توجد عمليات مسجلة بعد</p>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* Modern Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 z-40 pointer-events-none">
        <div className="max-w-xs mx-auto bg-slate-900 rounded-full p-2 shadow-2xl flex justify-center gap-4 pointer-events-auto">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentView('accounts')}
            className={`p-3 rounded-full transition-all ${currentView === 'accounts' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40 text-white' : 'text-slate-500'}`}
          >
            <Home className="w-6 h-6" />
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => investmentAccount && setCurrentView('investments')}
            className={`p-3 rounded-full transition-all ${currentView === 'investments' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40 text-white' : 'text-slate-500'}`}
          >
            <Wallet className="w-6 h-6" />
          </motion.button>
        </div>
      </footer>

      {/* Create Account Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            {/* Modal Content */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 flex items-center justify-between border-b border-slate-50 flex-shrink-0">
                <div className="w-10" /> {/* Spacer */}
                <span className="text-slate-400 font-medium">فتح حساب</span>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto">
                <h2 className="text-2xl font-bold text-slate-900 text-right">فتح حساب جديد</h2>
                
                <div className="space-y-5">
                  {/* Customer Number */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-400 text-right mr-1 uppercase tracking-wider">رقم العميل</label>
                    <div className="bg-slate-50 p-4 rounded-2xl text-right font-bold text-lg text-slate-800 border border-slate-100">
                      {nextCustomerNumber}
                    </div>
                  </div>

                  {/* Customer Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-400 text-right mr-1">اسم العميل</label>
                    <input 
                      type="text" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="أدخل الاسم بالكامل"
                      className="w-full bg-slate-50 p-4 rounded-2xl text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-400 text-right mr-1">المبلغ</label>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 p-4 rounded-2xl text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-2 text-right">
                    <label className="block text-sm font-semibold text-slate-400 text-right mr-1">التاريخ</label>
                    <div className="relative">
                      <input 
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-slate-50 p-4 rounded-2xl text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-500 transition-all font-medium text-slate-800 appearance-none cursor-pointer"
                      />
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateAccount}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all text-xl mt-4"
                >
                  انشاء الحساب
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit / Delete Modal */}
      <AnimatePresence>
        {isEditDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            {/* Modal Content */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 flex items-center justify-between border-b border-slate-50 flex-shrink-0">
                <div className="w-10" /> {/* Spacer */}
                <span className="text-slate-400 font-medium">حذف / تعديل</span>
                <button 
                  onClick={() => setIsEditDeleteModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8 space-y-10 overflow-y-auto">
                <h2 className="text-2xl font-bold text-slate-900 text-right">حذف / تعديل حساب موجود</h2>
                
                <div className="space-y-8">
                  {/* Edit Section */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-400 text-right mr-1">تعديل حساب</label>
                    <div className="flex gap-3 items-center">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleOpenEditNameModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all"
                      >
                        اذهب
                      </motion.button>
                      <div className="relative flex-1">
                        <select
                          value={selectedEditId}
                          onChange={(e) => setSelectedEditId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3.5 px-5 pr-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer font-medium text-right"
                        >
                          <option value="">اختر الحساب...</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>({acc.customerNumber}) {acc.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Delete Section */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-400 text-right mr-1">حذف حساب</label>
                    <div className="flex gap-3 items-center">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDeleteAccount}
                        className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg shadow-rose-500/20 transition-all"
                      >
                        احذف
                      </motion.button>
                      <div className="relative flex-1">
                        <select
                          value={selectedDeleteId}
                          onChange={(e) => setSelectedDeleteId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3.5 px-5 pr-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all appearance-none cursor-pointer font-medium text-right"
                        >
                          <option value="">اختر الحساب...</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>({acc.customerNumber}) {acc.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Balance Operation Modal */}
      <AnimatePresence>
        {isBalanceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBalanceModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-5 flex items-center justify-between border-b border-slate-50 flex-shrink-0">
                <div className="w-10" />
                <span className="text-slate-400 font-medium">
                  {balanceOpType === 'deposit' ? 'اختر العميل' : 'سحب رصيد'}
                </span>
                <button 
                  onClick={() => setIsBalanceModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {/* Customer Selection Dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-400 text-right mr-1">اختر العميل المستهدف</label>
                  <div className="relative group">
                    <select
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-4 px-5 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer font-medium text-right"
                      value={selectedEditId}
                      onChange={(e) => setSelectedEditId(e.target.value)}
                    >
                      <option value="">اختر من القائمة...</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                </div>

                {selectedEditId && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-6"
                  >
                    {/* Customer Number (Auto-filled) */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-400 text-right mr-1">رقم العميل</label>
                      <div className="bg-slate-100 p-4 rounded-2xl text-right font-bold text-lg text-slate-600 border border-slate-200">
                        {accounts.find(acc => acc.id === selectedEditId)?.customerNumber}
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-400 text-right mr-1">
                        {balanceOpType === 'deposit' ? 'المبلغ المضاف' : 'المبلغ المسحوب'}
                      </label>
                      <input 
                        type="number" 
                        placeholder="0.00"
                        autoFocus
                        value={balanceValue}
                        onChange={(e) => setBalanceValue(e.target.value)}
                        className={`w-full bg-slate-50 p-5 rounded-2xl text-right focus:outline-none focus:ring-2 border border-transparent transition-all font-bold text-2xl text-slate-800 ${balanceOpType === 'deposit' ? 'focus:ring-emerald-500/20 focus:border-emerald-500' : 'focus:ring-amber-500/20 focus:border-amber-500'}`}
                      />
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveBalanceOp}
                      className={`w-full text-white font-bold py-5 rounded-2xl shadow-xl transition-all text-xl mt-4 ${balanceOpType === 'deposit' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'}`}
                    >
                      تأكيد العملية
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Name Modal */}
      <AnimatePresence>
        {isEditNameModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditNameModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            {/* Modal Content */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 flex items-center justify-between border-b border-slate-50 flex-shrink-0">
                <div className="w-10" /> {/* Spacer */}
                <span className="text-slate-400 font-medium">تعديل اسم العميل</span>
                <button 
                  onClick={() => setIsEditNameModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  {/* Customer Number (Read-only) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-400 text-right mr-1 uppercase tracking-wider">رقم العميل</label>
                    <div className="bg-slate-50 p-4 rounded-2xl text-right font-bold text-lg text-slate-400 border border-slate-100">
                      {editNumberValue}
                    </div>
                  </div>

                  {/* Customer Name (Editable) */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-400 text-right mr-1">اسم العميل</label>
                    <input 
                      type="text" 
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      className="w-full bg-slate-50 p-4 rounded-2xl text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-500 transition-all font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveEditName}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-emerald-500/30 transition-all text-xl mt-4"
                >
                  حفظ التعديلات
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl text-center"
            >
              <div className="bg-rose-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">هل تريد حذف هذا الاستثمار؟</h3>
              <p className="text-slate-500 text-sm mb-8">لا يمكن التراجع عن هذه العملية بعد الحذف.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => handleDeleteOperation(operationToDeleteId)}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition-all"
                >
                  نعم، احذف
                </button>
                <button 
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Account Delete Confirmation Modal */}
      <AnimatePresence>
        {isAccountDeleteConfirmOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAccountDeleteConfirmOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl text-center"
            >
              <div className="bg-rose-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">هل تريد حذف هذا الحساب؟</h3>
              <p className="text-slate-500 text-sm mb-8">سيتم حذف الحساب وجميع العمليات المرتبطة به نهائياً. لا يمكن التراجع عن هذه العملية.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={confirmDeleteAccount}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition-all"
                >
                  نعم، احذف
                </button>
                <button 
                  onClick={() => setIsAccountDeleteConfirmOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Investment Details Modal */}
      <AnimatePresence>
        {isInvestmentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsInvestmentModalOpen(false);
                resetInvestmentForm();
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500 p-2 rounded-xl">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">تفاصيل الاستثمار</h2>
                </div>
                <button 
                  onClick={() => {
                    setIsInvestmentModalOpen(false);
                    resetInvestmentForm();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8">
                {/* Account Info Banner */}
                <div className="bg-slate-900 rounded-3xl p-6 text-white flex justify-between items-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <div className="relative z-10">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">الحساب النشط</p>
                    <h3 className="text-xl font-bold">{investmentAccount?.name}</h3>
                  </div>
                  <div className="relative z-10 text-left">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">الرصيد الحالي</p>
                    <p className="text-2xl font-mono font-bold text-emerald-400">{investmentAccount?.amount} <span className="text-xs">EGP</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Serial & Category Row */}
                  <div className="md:col-span-2 flex gap-4">
                    <div className="w-24 space-y-2">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-500 mr-1">
                        <Hash className="w-4 h-4" /> مسلسل
                      </label>
                      <input 
                        type="text" 
                        maxLength={3}
                        value={invSerial}
                        onChange={(e) => setInvSerial(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-500 mr-1">
                        <Tag className="w-4 h-4" /> نوع الاستثمار
                      </label>
                      <input 
                        type="text" 
                        value={invCategory}
                        maxLength={15}
                        onChange={(e) => setInvCategory(e.target.value)}
                        placeholder="الحد الأقصى 15 حرفاً"
                        className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-right font-medium"
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-500 mr-1">
                      <Calendar className="w-4 h-4" /> التاريخ
                    </label>
                    <input 
                      type="date" 
                      value={invDate}
                      onChange={(e) => setInvDate(e.target.value)}
                      className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-right font-medium"
                    />
                  </div>

                  {/* Type (Deposit/Withdraw) */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-500 mr-1">
                      {invType === 'withdraw' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />} نوع العملية
                    </label>
                    <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                      <button 
                        onClick={() => setInvType('deposit')}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${invType === 'deposit' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-400'}`}
                      >
                        إيداع
                      </button>
                      <button 
                        onClick={() => setInvType('withdraw')}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${invType === 'withdraw' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}
                      >
                        سحب
                      </button>
                    </div>
                  </div>

                  {/* Units */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-500 mr-1">
                      <Layers className="w-4 h-4" /> الوحدات
                    </label>
                    <input 
                      type="number" 
                      value={invUnits}
                      onChange={(e) => setInvUnits(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-right font-mono"
                    />
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-500 mr-1">
                      <DollarSign className="w-4 h-4" /> السعر
                    </label>
                    <input 
                      type="number" 
                      value={invPrice}
                      onChange={(e) => setInvPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-right font-mono"
                    />
                  </div>

                  {/* Fees Row */}
                  <div className="md:col-span-2">
                    <div className="w-32 space-y-2">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-500 mr-1">
                        <DollarSign className="w-4 h-4" /> رسوم الشراء
                      </label>
                      <input 
                        type="number" 
                        value={invCommission}
                        onChange={(e) => setInvCommission(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-right font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100">
                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">قيمة الاستثمار الفعلي</p>
                    <p className="text-xl font-mono font-bold text-slate-700">
                      {((parseFloat(invUnits) || 0) * (parseFloat(invPrice) || 0)).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100">
                    <p className="text-emerald-600 text-[10px] font-bold uppercase mb-1">الرصيد المتبقي</p>
                    <p className="text-xl font-mono font-bold text-emerald-800">
                      {getPreviewBalance()}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSaveInvestment}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-emerald-500/30 transition-all text-xl"
                >
                  حفظ العملية
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Account Statement Modal */}
      <AnimatePresence>
        {isStatementModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStatementModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500 p-2 rounded-xl">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">كشف حساب تفصيلي</h3>
                    <p className="text-slate-400 text-xs">{investmentAccount?.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsStatementModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50 border-b border-slate-100">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 leading-tight">إجمالي المشتريات</p>
                  <p className="text-sm font-mono font-bold text-rose-600 break-all">
                    {investmentAccount?.operations?.filter(op => op.type === 'deposit' && op.category !== 'إيداع نقدي' && op.category !== 'سحب نقدي').reduce((acc, op) => acc + parseFloat(op.totalValue), 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 leading-tight">إجمالي المبيعات</p>
                  <p className="text-sm font-mono font-bold text-emerald-600 break-all">
                    {investmentAccount?.operations?.filter(op => op.type === 'withdraw' && op.category !== 'إيداع نقدي' && op.category !== 'سحب نقدي').reduce((acc, op) => acc + parseFloat(op.totalValue), 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 leading-tight">الرصيد الحالي</p>
                  <p className="text-sm font-mono font-bold text-slate-900 break-all">
                    {investmentAccount?.amount}
                  </p>
                </div>
              </div>

              {/* Table Content */}
              <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-3 font-bold px-2">التاريخ</th>
                      <th className="pb-3 font-bold px-2">البيان</th>
                      <th className="pb-3 font-bold px-2">النوع</th>
                      <th className="pb-3 font-bold px-2">القيمة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {investmentAccount?.operations?.map((op) => {
                      const isCashDeposit = op.category === 'إضافة رصيد' || op.category === 'إيداع نقدي';
                      const isCashWithdraw = op.category === 'سحب رصيد' || op.category === 'سحب نقدي';
                      const isBuy = op.type === 'deposit' && !isCashDeposit && !isCashWithdraw;
                      const isSell = op.type === 'withdraw' && !isCashDeposit && !isCashWithdraw;
                      
                      let sign = '';
                      let colorClass = '';
                      
                      if (isCashDeposit || isSell) {
                        sign = '+';
                        colorClass = 'text-emerald-600';
                      } else {
                        sign = '-';
                        colorClass = 'text-rose-600';
                      }

                      return (
                        <tr key={op.id} className="text-sm hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-2 text-slate-500 font-mono">{op.date}</td>
                          <td className="py-4 px-2 font-bold text-slate-800">{op.category}</td>
                          <td className="py-4 px-2">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${colorClass.replace('text-', 'bg-').replace('600', '50')} ${colorClass}`}>
                              {isCashDeposit ? 'إيداع نقدي' : isCashWithdraw ? 'سحب نقدي' : isBuy ? 'شراء' : 'بيع'}
                            </span>
                          </td>
                          <td className={`py-4 px-2 font-mono font-bold ${colorClass}`}>
                            {sign}{op.totalValue}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer Actions */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                >
                  <Download className="w-4 h-4" />
                  تحميل كملف PDF
                </button>
                <button 
                  onClick={() => setIsStatementModalOpen(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-100 transition-all"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95, x: "-50%" }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1, 
              x: "-50%",
              transition: { type: "spring", damping: 25, stiffness: 300 }
            }}
            exit={{ opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } }}
            className="fixed bottom-12 left-1/2 z-[200] bg-white/90 backdrop-blur-md border border-slate-200/50 text-slate-800 px-6 py-4 rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.1)] font-bold text-base flex items-center gap-4 min-w-[180px] justify-center"
          >
            <div className="bg-emerald-500/10 rounded-full p-2 flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="tracking-wide">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
