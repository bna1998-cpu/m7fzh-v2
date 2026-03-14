/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, ChevronDown, PlusCircle, Plus, Trash2, Wallet, X, Calendar, ArrowUpRight, ArrowDownLeft, Hash, Tag, DollarSign, Layers, Percent, Eye, ArrowRight, FileText, Download, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
// استيراد مكتبة الإحصائيات
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

  // Disable Pull-to-refresh
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
  const [editNumberValue, setEditNumberValue] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastPosition, setToastPosition] = useState<'bottom' | 'center'>('bottom');
  const [isSparkling, setIsSparkling] = useState(false);
  
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('accounts');
    const initialAccounts = saved ? JSON.parse(saved) : [];
    return initialAccounts
      .filter((acc: Account) => !(acc.customerNumber === '100' && acc.name === 'المحفظة الرئيسية (EGP)'))
      .map((acc: Account) => acc.customerNumber === '100' ? { ...acc, customerNumber: '101' } : acc);
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
  const [selectedEditId, setSelectedEditId] = useState('');
  const [selectedDeleteId, setSelectedDeleteId] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAccountDeleteConfirmOpen, setIsAccountDeleteConfirmOpen] = useState(false);
  const [operationToDeleteId, setOperationToDeleteId] = useState('');
  const [editingOperationId, setEditingOperationId] = useState('');
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [investmentAccount, setInvestmentAccount] = useState<Account | null>(null);

  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [invSerial, setInvSerial] = useState('1');
  const [invType, setInvType] = useState<'deposit' | 'withdraw'>('deposit');
  const [invCategory, setInvCategory] = useState('');
  const [invUnits, setInvUnits] = useState('');
  const [invPrice, setInvPrice] = useState('');
  const [invCommission, setInvCommission] = useState('');

  const handleEnterAccount = () => {
    if (!selectedAccountId) return;
    const account = accounts.find(acc => acc.id === selectedAccountId);
    if (account) {
      setInvestmentAccount(account);
      setCurrentView('investments');
    }
  };

  return (
    <div className="h-[100vh] w-full bg-slate-50 flex flex-col relative overflow-y-auto" dir="rtl">
      {/* Header */}
      <header className="bg-slate-900 pt-6 pb-8 px-6 rounded-b-[2rem] shadow-lg sticky top-0 z-30">
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-emerald-500 p-2 rounded-xl mb-2 shadow-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">
            {currentView === 'accounts' ? 'محفظة الاستثمار' : 'استثماراتي'}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 -mt-4 relative z-20 space-y-4 pb-24">
        {currentView === 'accounts' ? (
          <div className="bg-white rounded-2xl p-4 shadow-xl border border-slate-100">
            <select 
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl mb-3"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              <option value="">اختر حساب للدخول</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
            <button onClick={handleEnterAccount} className="w-full bg-emerald-500 text-white p-3 rounded-xl font-bold">دخول</button>
          </div>
        ) : (
          <div className="text-center p-10">
            <h2 className="text-2xl font-bold mb-4">{investmentAccount?.name}</h2>
            <button onClick={() => setCurrentView('accounts')} className="text-blue-500 underline">العودة للرئيسية</button>
          </div>
        )}
      </main>

      {/* Navigation Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 z-40 pointer-events-none">
        <div className="max-w-xs mx-auto bg-slate-900 rounded-full p-2 shadow-2xl flex justify-center gap-4 pointer-events-auto">
          <button onClick={() => setCurrentView('accounts')} className="p-3 text-white">
            <Home className="w-6 h-6" />
          </button>
        </div>
      </footer>

      {/* كود إحصائيات فيرسل - بيراقب الموقع كله */}
      <Analytics />
    </div>
  );
}
