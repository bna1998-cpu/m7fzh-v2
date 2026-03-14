/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, ChevronDown, PlusCircle, Plus, Trash2, Wallet, X, Calendar, ArrowUpRight, ArrowDownLeft, Hash, Tag, DollarSign, Layers, Percent, Eye, ArrowRight, FileText, Download, Check, Edit2 } from 'lucide-react';
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditDeleteModalOpen, setIsEditDeleteModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [investmentAccount, setInvestmentAccount] = useState<Account | null>(null);
  
  // Toast State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Accounts Persistence
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('accounts');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('accounts', JSON.stringify(accounts));
  }, [accounts]);

  // Form States
  const [customerName, setCustomerName] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Investment Form State
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [invCategory, setInvCategory] = useState('');
  const [invUnits, setInvUnits] = useState('');
  const [invPrice, setInvPrice] = useState('');
  const [invCommission, setInvCommission] = useState('');
  const [invType, setInvType] = useState<'deposit' | 'withdraw'>('deposit');

  const triggerToast = (msg: string, type: 'success' | 'error') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleCreateAccount = () => {
    if (!customerName || !initialAmount) return triggerToast('برجاء ملء البيانات', 'error');
    const newAcc: Account = {
      id: Math.random().toString(36).substr(2, 9),
      name: customerName,
      amount: parseFloat(initialAmount).toFixed(2),
      date: new Date().toLocaleDateString('en-GB'),
      customerNumber: (accounts.length + 101).toString(),
      operations: []
    };
    setAccounts([...accounts, newAcc]);
    setIsCreateModalOpen(false);
    setCustomerName('');
    setInitialAmount('');
    triggerToast('تم إنشاء الحساب بنجاح', 'success');
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
    triggerToast('تم حذف الحساب', 'success');
  };

  const handleSaveInvestment = () => {
    if (!investmentAccount || !invCategory || !invUnits || !invPrice) return triggerToast('اكمل البيانات', 'error');
    
    const units = parseFloat(invUnits);
    const price = parseFloat(invPrice);
    const comm = parseFloat(invCommission) || 0;
    const actual = units * price;
    const total = invType === 'deposit' ? actual + comm : actual - comm;

    if (invType === 'deposit' && total > parseFloat(investmentAccount.amount)) {
      return triggerToast('الرصيد غير كافٍ', 'error');
    }

    const newOp: InvestmentOperation = {
      id: Math.random().toString(36).substr(2, 9),
      date: invDate,
      serial: (investmentAccount.operations?.length || 0 + 1).toString(),
      type: invType,
      category: invCategory,
      units: invUnits,
      price: invPrice,
      commission: invCommission,
      actualValue: actual.toFixed(2),
      totalValue: total.toFixed(2),
    };

    const updatedAccounts = accounts.map(acc => {
      if (acc.id === investmentAccount.id) {
        const newBalance = invType === 'deposit' 
          ? parseFloat(acc.amount) - total 
          : parseFloat(acc.amount) + total;
        return { 
          ...acc, 
          amount: newBalance.toFixed(2), 
          operations: [newOp, ...(acc.operations || [])] 
        };
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    setInvestmentAccount(updatedAccounts.find(a => a.id === investmentAccount.id) || null);
    setIsInvestmentModalOpen(false);
    triggerToast('تمت العملية بنjاح', 'success');
  };

  // --- Analytics Component ---
  const AnalyticsSection = () => {
    if (!investmentAccount || !investmentAccount.operations || investmentAccount.operations.length === 0) return null;

    const ops = investmentAccount.operations;
    const totalInvested = ops.filter(o => o.type === 'deposit').reduce((acc, o) => acc + parseFloat(o.actualValue), 0);
    const totalSold = ops.filter(o => o.type === 'withdraw').reduce((acc, o) => acc + parseFloat(o.actualValue), 0);
    
    const categories: Record<string, number> = {};
    ops.forEach(op => {
      categories[op.category] = (categories[op.category] || 0) + parseFloat(op.actualValue);
    });

    return (
      <div className="space-y-4 mb-10 mt-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100">
            <p className="text-blue-600 text-[10px] font-bold uppercase">إجمالي الشراء</p>
            <p className="text-xl font-black text-blue-900">{totalInvested.toFixed(2)}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100">
            <p className="text-amber-600 text-[10px] font-bold uppercase">إجمالي البيع</p>
            <p className="text-xl font-black text-amber-900">{totalSold.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
            <Layers className="w-4 h-4 text-emerald-500" /> توزيع المحفظة
          </h4>
          <div className="space-y-3">
            {Object.entries(categories).map(([name, value], index) => {
              const percentage = ((value / (totalInvested || 1)) * 100).toFixed(1);
              return (
                <div key={name} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-500">{name}</span>
                    <span className="text-emerald-600">{percentage}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className={`h-full ${index % 2 === 0 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[100vh] w-full bg-slate-50 flex flex-col relative overflow-hidden font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-slate-900 pt-8 pb-10 px-6 rounded-b-[2.5rem] shadow-lg sticky top-0 z-30">
        <div className="flex flex-col items-center">
          <div className="bg-emerald-500 p-2.5 rounded-2xl mb-2 shadow-lg shadow-emerald-500/20">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            {currentView === 'accounts' ? 'محفظة الاستثمار' : 'سجل العمليات'}
          </h1>
        </div>
        {currentView === 'investments' && (
          <button onClick={() => setCurrentView('accounts')} className="absolute top-8 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 -mt-6 overflow-y-auto pb-28">
        {currentView === 'accounts' ? (
          <div className="space-y-4 pt-2">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100">
              <label className="block text-[10px] font-black text-slate-400 mb-3 mr-1">المحفظة الحالية</label>
              <select 
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl mb-4 text-right font-bold focus:border-emerald-500 outline-none transition-all"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
              >
                <option value="">اختر حساب لاستعراضه...</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>({acc.customerNumber}) {acc.name}</option>)}
              </select>
              <button 
                onClick={() => {
                  const acc = accounts.find(a => a.id === selectedAccountId);
                  if(acc) { setInvestmentAccount(acc); setCurrentView('investments'); }
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
              >
                دخول للحساب
              </button>
            </motion.div>
            
            <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setIsCreateModalOpen(true)} className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 flex flex-col items-center gap-3 shadow-sm hover:border-blue-200 transition-all group">
                  <div className="p-3 bg-blue-50 rounded-2xl group-hover:bg-blue-100 transition-colors">
                    <PlusCircle className="text-blue-600 w-6 h-6" />
                  </div>
                  <span className="text-xs font-black text-slate-700">إنشاء حساب</span>
               </button>
               <button onClick={() => setIsEditDeleteModalOpen(true)} className="bg-white p-6 rounded-[2rem] border-2 border-slate-50 flex flex-col items-center gap-3 shadow-sm hover:border-rose-200 transition-all group">
                  <div className="p-3 bg-rose-50 rounded-2xl group-hover:bg-rose-100 transition-colors">
                    <Trash2 className="text-rose-600 w-6 h-6" />
                  </div>
                  <span className="text-xs font-black text-slate-700">تعديل / حذف</span>
               </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col pt-2">
            <div className="bg-slate-900 rounded-[2.5rem] p-7 text-white mb-6 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">الرصيد المتاح حالياً</p>
               <h2 className="text-3xl font-black text-emerald-400 mb-1">{investmentAccount?.amount} <span className="text-sm">EGP</span></h2>
               <p className="text-slate-300 text-xs font-medium">{investmentAccount?.name}</p>
            </div>

            <button onClick={() => setIsInvestmentModalOpen(true)} className="bg-rose-500 text-white p-4 rounded-2xl mb-4 font-black flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95 transition-all">
              <Plus className="w-5 h-5" /> إضافة عملية استثمار
            </button>

            {/* الإحصائيات تظهر هنا */}
            <AnalyticsSection />

            <h3 className="font-black text-slate-800 mb-4 px-1 text-sm">آخر العمليات</h3>
            <div className="space-y-3">
              {investmentAccount?.operations?.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-bold bg-white rounded-3xl border-2 border-dashed border-slate-200">لا توجد عمليات مسجلة بعد</div>
              ) : (
                investmentAccount?.operations?.map(op => (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={op.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${op.type === 'deposit' ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                        {op.type === 'deposit' ? <ArrowUpRight className="w-4 h-4 text-rose-500" /> : <ArrowDownLeft className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{op.category}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{op.date}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className={`font-black ${op.type === 'deposit' ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {op.type === 'deposit' ? '-' : '+'}{op.totalValue}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold">{op.units} وحدة</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals Implementation */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative z-10 shadow-2xl">
              <h3 className="text-xl font-black mb-6">إنشاء محفظة جديدة</h3>
              <input type="text" placeholder="اسم العميل" className="w-full bg-slate-50 p-4 rounded-2xl mb-4 text-right font-bold border-2 border-slate-100" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <input type="number" placeholder="رصيد البداية" className="w-full bg-slate-50 p-4 rounded-2xl mb-6 text-right font-bold border-2 border-slate-100" value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} />
              <div className="flex gap-3">
                <button onClick={handleCreateAccount} className="flex-1 bg-emerald-500 text-white font-black py-4 rounded-2xl">حفظ الحساب</button>
                <button onClick={() => setIsCreateModalOpen(false)} className="px-6 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}

        {isInvestmentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsInvestmentModalOpen(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full max-w-lg rounded-t-[3rem] p-8 relative z-10 max-h-[90vh] overflow-y-auto">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
              <h3 className="text-xl font-black mb-6 text-center">تفاصيل العملية</h3>
              <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-50 p-2 rounded-2xl">
                <button onClick={() => setInvType('deposit')} className={`py-3 rounded-xl font-black transition-all ${invType === 'deposit' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400'}`}>شراء / استثمار</button>
                <button onClick={() => setInvType('withdraw')} className={`py-3 rounded-xl font-black transition-all ${invType === 'withdraw' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400'}`}>بيع / استرداد</button>
              </div>
              <div className="space-y-4">
                <input type="date" className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 font-bold" value={invDate} onChange={e => setInvDate(e.target.value)} />
                <input type="text" placeholder="اسم الصندوق / الفئة" className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 font-bold" value={invCategory} onChange={e => setInvCategory(e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="عدد الوحدات" className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 font-bold" value={invUnits} onChange={e => setInvUnits(e.target.value)} />
                  <input type="number" placeholder="سعر الوحدة" className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 font-bold" value={invPrice} onChange={e => setInvPrice(e.target.value)} />
                </div>
                <input type="number" placeholder="المصاريف / العمولات" className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 font-bold" value={invCommission} onChange={e => setInvCommission(e.target.value)} />
              </div>
              <button onClick={handleSaveInvestment} className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl mt-8 shadow-xl shadow-slate-900/20">تأكيد العملية</button>
            </motion.div>
          </div>
        )}

        {isEditDeleteModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditDeleteModalOpen(false)} />
             <motion.div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 relative z-10 max-h-[70vh] overflow-y-auto">
                <h3 className="font-black mb-4">إدارة الحسابات</h3>
                {accounts.map(acc => (
                  <div key={acc.id} className="flex justify-between items-center p-4 border-b border-slate-50">
                    <div>
                      <p className="font-bold text-sm">{acc.name}</p>
                      <p className="text-[10px] text-slate-400">{acc.amount} EGP</p>
                    </div>
                    <button onClick={() => handleDeleteAccount(acc.id)} className="p-2 text-rose-500 bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                  </div>
                ))}
             </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 z-40 pointer-events-none">
        <div className="max-w-xs mx-auto bg-slate-900/95 backdrop-blur-md rounded-full p-2 shadow-2xl flex justify-center gap-4 pointer-events-auto border border-white/10">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentView('accounts')}
            className={`flex items-center gap-2 px-8 py-3 rounded-full transition-all ${currentView === 'accounts' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500'}`}
          >
            <Home className="w-5 h-5" />
            {currentView === 'accounts' && <span className="text-xs font-black">الرئيسية</span>}
          </motion.button>
        </div>
      </footer>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl text-white font-black shadow-2xl ${toastType === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
      <Analytics />
    </div>
  );
}
