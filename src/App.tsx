/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, ChevronDown, PlusCircle, Plus, Trash2, Wallet, X, Calendar, ArrowUpRight, ArrowDownLeft, Hash, Tag, DollarSign, Layers, Percent, Eye, ArrowRight, FileText, Download, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';

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

  // Disable Pull-to-refresh logic
  useEffect(() => {
    document.body.style.overscrollBehaviorY = 'none';
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => { startY = e.touches[0].pageY; };
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const currentY = touch.pageY;
      const isSwipingDown = currentY > startY;
      let el = e.target as HTMLElement | null;
      while (el && el !== document.body) {
        const style = window.getComputedStyle(el);
        const overflowY = style.getPropertyValue('overflow-y');
        if (overflowY === 'auto' || overflowY === 'scroll') {
          if (isSwipingDown && el.scrollTop <= 0 && e.cancelable) e.preventDefault();
          return;
        }
        el = el.parentElement;
      }
      if (isSwipingDown && window.scrollY <= 0 && e.cancelable) e.preventDefault();
    };
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditDeleteModalOpen, setIsEditDeleteModalOpen] = useState(false);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceOpType, setBalanceOpType] = useState<'deposit' | 'withdraw'>('deposit');
  const [balanceValue, setBalanceValue] = useState('');
  const [balanceError, setBalanceError] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastPosition, setToastPosition] = useState<'bottom' | 'center'>('bottom');
  const [isSparkling, setIsSparkling] = useState(false);

  // Persistence Logic
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('accounts');
    const initialAccounts = saved ? JSON.parse(saved) : [];
    return initialAccounts.filter((acc: Account) => !(acc.customerNumber === '100' && acc.name === 'المحفظة الرئيسية (EGP)'));
  });

  const [nextCustomerNumber, setNextCustomerNumber] = useState(101);

  useEffect(() => {
    localStorage.setItem('accounts', JSON.stringify(accounts));
    if (accounts.length === 0) setNextCustomerNumber(101);
    else {
      const nums = accounts.map(acc => parseInt(acc.customerNumber)).filter(n => !isNaN(n));
      setNextCustomerNumber(Math.max(...nums, 100) + 1);
    }
  }, [accounts]);

  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedEditId, setSelectedEditId] = useState('');
  const [selectedDeleteId, setSelectedDeleteId] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAccountDeleteConfirmOpen, setIsAccountDeleteConfirmOpen] = useState(false);
  const [operationToDeleteId, setOperationToDeleteId] = useState('');
  const [editingOperationId, setEditingOperationId] = useState('');
  const [investmentAccount, setInvestmentAccount] = useState<Account | null>(null);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  // Investment Form State
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [invSerial, setInvSerial] = useState('');
  const [invType, setInvType] = useState<'deposit' | 'withdraw'>('deposit');
  const [invCategory, setInvCategory] = useState('');
  const [invUnits, setInvUnits] = useState('');
  const [invPrice, setInvPrice] = useState('');
  const [invCommission, setInvCommission] = useState('');

  const resetInvestmentForm = (account?: Account | null) => {
    setInvDate(new Date().toISOString().split('T')[0]);
    setInvType('deposit');
    setInvCategory('');
    setInvUnits('');
    setInvPrice('');
    setInvCommission('');
    setInvSerial('');
    setEditingOperationId('');
  };

  const handleEnterAccount = () => {
    const account = accounts.find(acc => acc.id === selectedAccountId);
    if (account) {
      setInvestmentAccount(account);
      setCurrentView('investments');
      resetInvestmentForm(account);
    } else {
      triggerToast('اختر حساب من القائمة', 'error', 'center');
    }
  };

  const triggerToast = (msg: string, type: 'success' | 'error', pos: 'bottom' | 'center') => {
    setToastMessage(msg);
    setToastType(type);
    setToastPosition(pos);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleSaveInvestment = () => {
    if (!investmentAccount) return;
    const units = parseFloat(invUnits) || 0;
    const price = parseFloat(invPrice) || 0;
    const comm = parseFloat(invCommission) || 0;
    const actual = units * price;
    const total = invType === 'deposit' ? actual + comm : actual - comm;

    const newOp: InvestmentOperation = {
      id: editingOperationId || Math.random().toString(36).substr(2, 9),
      date: invDate.replace(/-/g, '/'),
      serial: invSerial,
      type: invType,
      category: invCategory,
      units: invUnits,
      price: invPrice,
      commission: invCommission,
      actualValue: actual.toFixed(2),
      totalValue: total.toFixed(2),
    };

    const updated = accounts.map(acc => {
      if (acc.id === investmentAccount.id) {
        let currentBal = parseFloat(acc.amount);
        if (editingOperationId) {
          const old = acc.operations?.find(o => o.id === editingOperationId);
          if (old) currentBal = old.type === 'deposit' ? currentBal + parseFloat(old.totalValue) : currentBal - parseFloat(old.totalValue);
        }
        if (invType === 'deposit' && total > currentBal) {
          triggerToast('رصيدك لا يسمح', 'error', 'center');
          return acc;
        }
        const newBal = invType === 'deposit' ? currentBal - total : currentBal + total;
        let ops = acc.operations || [];
        ops = editingOperationId ? ops.map(o => o.id === editingOperationId ? newOp : o) : [newOp, ...ops];
        return { ...acc, amount: newBal.toFixed(2), operations: ops };
      }
      return acc;
    });

    setAccounts(updated);
    setInvestmentAccount(updated.find(a => a.id === investmentAccount.id) || null);
    setIsInvestmentModalOpen(false);
    triggerToast('تمت العملية بنجاح', 'success', 'bottom');
  };

  return (
    <div className="h-[100vh] w-full bg-slate-50 flex flex-col relative overflow-y-scroll" dir="rtl">
      {/* Header */}
      <header className="bg-slate-900 pt-6 pb-8 px-6 rounded-b-[2rem] shadow-lg sticky top-0 z-30">
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-emerald-500 p-2 rounded-xl mb-2">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">
            {currentView === 'accounts' ? 'محفظة الاستثمار' : 'استثماراتي'}
          </h1>
        </div>
        {currentView === 'investments' && (
          <button onClick={() => setCurrentView('accounts')} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full">
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        )}
      </header>

      {/* Main Content */}
      {currentView === 'accounts' ? (
        <main className="flex-1 px-4 -mt-4 space-y-4 pb-24 overflow-y-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-4 shadow-xl border border-slate-100">
            <label className="block text-[10px] font-semibold text-slate-400 mb-2">اختر المحفظة</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl mb-3 text-right"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              <option value="">اختر حساب...</option>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>({acc.customerNumber}) {acc.name}</option>)}
            </select>
            <button onClick={handleEnterAccount} className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl">دخول للحساب</button>
          </motion.div>
          
          <div className="grid grid-cols-2 gap-3">
             <button onClick={() => setIsCreateModalOpen(true)} className="bg-white p-4 rounded-2xl border flex flex-col items-center gap-2">
                <PlusCircle className="text-blue-600" /> <span className="text-sm font-bold">إنشاء حساب</span>
             </button>
             <button onClick={() => setIsEditDeleteModalOpen(true)} className="bg-white p-4 rounded-2xl border flex flex-col items-center gap-2">
                <Trash2 className="text-rose-600" /> <span className="text-sm font-bold">تعديل / حذف</span>
             </button>
          </div>
        </main>
      ) : (
        <main className="flex-1 px-6 -mt-6 flex flex-col overflow-hidden">
          <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white mb-4">
            <p className="text-slate-400 text-xs">الرصيد المتاح</p>
            <h2 className="text-3xl font-bold text-emerald-400">{investmentAccount?.amount} EGP</h2>
            <p className="text-sm mt-2">{investmentAccount?.name}</p>
          </div>
          <button onClick={() => { resetInvestmentForm(); setIsInvestmentModalOpen(true); }} className="bg-rose-500 text-white p-4 rounded-2xl mb-4 font-bold flex items-center justify-center gap-2">
            <Plus /> إضافة عملية استثمار
          </button>
          <div className="flex-1 overflow-y-auto pb-32">
            {investmentAccount?.operations?.map(op => (
              <div key={op.id} className="bg-white p-4 rounded-2xl mb-2 border flex justify-between items-center">
                <div>
                  <p className="font-bold">{op.category}</p>
                  <p className="text-xs text-slate-400">{op.date}</p>
                </div>
                <p className={`font-bold ${op.type === 'deposit' ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {op.type === 'deposit' ? '-' : '+'}{op.totalValue}
                </p>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 z-40 pointer-events-none">
        <div className="max-w-xs mx-auto bg-slate-900 rounded-full p-2 shadow-2xl flex justify-center gap-4 pointer-events-auto">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentView('accounts')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${currentView === 'accounts' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}
          >
            <Home className="w-5 h-5" />
            {currentView === 'accounts' && <span className="text-sm font-bold">الرئيسية</span>}
          </motion.button>
        </div>
      </footer>

      <Analytics />
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }}
            className={`fixed ${toastPosition === 'bottom' ? 'bottom-24' : 'top-1/2'} left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl text-white font-bold shadow-lg ${toastType === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
