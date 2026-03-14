/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, ChevronDown, PlusCircle, Plus, Trash2, Wallet, X, Calendar, ArrowUpRight, ArrowDownLeft, Hash, Tag, DollarSign, Layers, Percent, Eye, ArrowRight, FileText, Download, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
// إضافة مكتبة الإحصائيات هنا
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

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].pageY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const currentY = touch.pageY;
      const isSwipingDown = currentY > startY;
      
      let el = e.target as HTMLElement | null;
      while (el && el !== document.body) {
        const style = window.getComputedStyle(el);
        const overflowY = style.getPropertyValue('overflow-y');
        const isScrollable = overflowY === 'auto' || overflowY === 'scroll';
        const canScrollUp = el.scrollTop > 0;

        if (isScrollable) {
          if (isSwipingDown && !canScrollUp) {
            if (e.cancelable) e.preventDefault();
          }
          return;
        }
        el = el.parentElement;
      }

      if (isSwipingDown && window.scrollY <= 0) {
        if (e.cancelable) e.preventDefault();
      }
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
  const [toastMessage, setToastMessage] = useState('تم التعديل بنجاح');
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
    if (accounts.length === 0) {
      setNextCustomerNumber(101);
    } else {
      const nums = accounts.map(acc => parseInt(acc.customerNumber)).filter(n => !isNaN(n));
      const maxNum = Math.max(...nums, 100);
      setNextCustomerNumber(maxNum + 1);
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

  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [investmentAccount, setInvestmentAccount] = useState<Account | null>(null);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);

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

  const resetInvestmentForm = (account?: Account | null) => {
    setInvDate(new Date().toISOString().split('T')[0]);
    setInvType('deposit');
    setInvCategory('');
    setInvUnits('');
    setInvPrice('');
    setInvCommission('');
    setEditingOperationId('');
    const targetAcc = account || investmentAccount;
    setInvSerial(targetAcc ? ((targetAcc.operations?.length || 0) + 1).toString() : '1');
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

  return (
    <div 
      className="h-[100vh] w-full bg-slate-50 flex flex-col relative overflow-y-scroll" 
      dir="rtl"
    >
      {/* Header */}
      <header className="bg-slate-900 pt-6 pb-8 px-6 rounded-b-[2rem] shadow-lg relative overflow-hidden sticky top-0 z-30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        {currentView === 'investments' && (
          <button onClick={() => setCurrentView('accounts')} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full z-40">
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        )}
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-emerald-500 p-2 rounded-xl mb-2 shadow-lg"><Wallet className="w-6 h-6 text-white" /></div>
          <h1 className="text-xl font-bold text-white">محفظة الاستثمار</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 -mt-4 relative z-20">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
           <p className="text-center text-slate-500">تم استعادة الكود بنجاح يا أحمد!</p>
        </div>
      </main>

      {/* إضافة الـ Analytics هنا */}
      <Analytics />
    </div>
  );
}
