import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../services/api';

const CATEGORY_MAP = {
  partitions: ['Glass Partition', 'Gypsum Partition', 'Wooden Partition', 'Others'],
  doors: ['Single Door', 'Double Door', 'Sliding Door', 'Others'],
  windows: ['Sliding Window', 'Casement Window', 'Fixed Window', 'Others'],
  ceilings: ['POP Ceiling', 'Grid Ceiling', 'Gypsum Ceiling', 'Others'],
  others: ['Others']
};

export default function QuotationBuilder() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reviseId = searchParams.get('reviseId');

  const [customer, setCustomer] = useState(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);

  // Table & Form State
  const [projectUnit, setProjectUnit] = useState('Ft Inch');
  const [items, setItems] = useState([
    { id: '1', category: '', subcategory: '', otherCategory: '', otherSubcategory: '', subCheckboxes: [], description: '', width: '', height: '', depth: '', unit: 'SQ.FT.', qty: 0, noOfUnit: 1, totalQty: 0, unitRate: 0, amount: 0, selected: true, imageUrl: '' }
  ]);
  const [discountType, setDiscountType] = useState('flat'); // 'flat' or 'percent'
  const [discountInputVal, setDiscountInputVal] = useState(0);
  const [includeGst, setIncludeGst] = useState(true);
  const [unitLocked, setUnitLocked] = useState(false);

  // Modals & Preview State
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeDescriptionPopup, setActiveDescriptionPopup] = useState(null);
  const [parentQuotationId, setParentQuotationId] = useState(null);
  const [loadingQuotation, setLoadingQuotation] = useState(false);
  const [approvedItems, setApprovedItems] = useState([]);
  const [quotationType, setQuotationType] = useState('BUDGET_QUOTE');

  const fetchApprovedItems = async (qType) => {
    try {
      const boqRes = await API.get('/boq/approved', {
        params: { quotationType: qType }
      });
      const rawItems = boqRes.data || [];
      const seen = new Set();
      const fetchedApproved = rawItems.filter(item => {
        if (!item.subHeading) return false;
        const key = item.subHeading.toLowerCase().trim();
        const duplicate = seen.has(key);
        seen.add(key);
        return !duplicate;
      });
      setApprovedItems(fetchedApproved);
      return fetchedApproved;
    } catch (err) {
      console.error('Failed to fetch approved BOQ categories', err);
      return [];
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setLoadingCustomer(true);
      if (reviseId) {
        setLoadingQuotation(true);
      }
      try {
        // 1. Fetch customer
        const customerRes = await API.get(`/customers/${customerId}`);
        setCustomer(customerRes.data);

        // 2. Fetch approved items
        let fetchedApproved = await fetchApprovedItems(quotationType);

        // 3. Fetch quotation if revising
        if (reviseId) {
          const quoteRes = await API.get(`/quotations/${reviseId}`);
          const qData = quoteRes.data || {};

          if (qData.quotationType) {
            setQuotationType(qData.quotationType);
            fetchedApproved = await fetchApprovedItems(qData.quotationType);
          }

          // Set top-level configuration
          setProjectUnit(qData.projectUnit || 'Ft Inch');
          if (qData.discountPercent !== null && qData.discountPercent !== undefined && parseFloat(qData.discountPercent) > 0) {
            setDiscountType('percent');
            setDiscountInputVal(parseFloat(qData.discountPercent));
          } else {
            setDiscountType('flat');
            setDiscountInputVal(parseFloat(qData.discount) || 0);
          }
          setIncludeGst(qData.includeGst !== false);
          setParentQuotationId(qData.parentQuotationId ? qData.parentQuotationId : qData.id);
          setUnitLocked(true); // Lock the mode since items are pre-loaded

          // Map items
          const qItems = qData.items || [];
          const mappedItems = qItems.map((item, idx) => {
            const lowerCategory = item.category ? String(item.category).toLowerCase().trim() : '';
            const matchingApproved = fetchedApproved.find(ai => ai.subHeading && ai.subHeading.toLowerCase() === lowerCategory);

            let categoryVal = '';
            let otherCategory = '';
            let subcategoryVal = '';
            let otherSubcategory = '';
            let subCheckboxes = [];
            let selectedType = '';

            if (matchingApproved) {
              categoryVal = matchingApproved.subHeading;
              subcategoryVal = item.subcategory || '';
              selectedType = matchingApproved.mainHeading || '';
            } else {
              const standardKeys = ['partitions', 'doors', 'windows', 'ceilings', 'others'];
              const matchedKey = standardKeys.find(k => k === lowerCategory);
              if (matchedKey) {
                categoryVal = matchedKey;
                const subStr = item.subcategory ? String(item.subcategory) : '';
                const databaseSubs = subStr ? subStr.split(', ').map(s => s.trim()) : [];
                const standardSubs = CATEGORY_MAP[matchedKey] || [];
                databaseSubs.forEach(sub => {
                  if (standardSubs.includes(sub)) {
                    subCheckboxes.push(sub);
                  } else {
                    if (!subCheckboxes.includes('Others')) {
                      subCheckboxes.push('Others');
                    }
                    otherSubcategory = sub;
                  }
                });
                subcategoryVal = subStr;
              } else {
                categoryVal = 'others';
                otherCategory = item.category || '';
                subcategoryVal = item.subcategory || '';
              }
            }

            return {
              id: `loaded-${idx}-${Math.random()}`,
              category: categoryVal,
              subcategory: subcategoryVal,
              otherCategory,
              otherSubcategory,
              subCheckboxes,
              selectedType,
              description: item.description || '',
              width: item.width || '',
              height: item.height || '',
              depth: item.depth || '',
              unit: item.unit || 'SQ.FT.',
              qty: parseFloat(item.qty) || 0,
              noOfUnit: parseFloat(item.noOfUnit) || 1,
              totalQty: parseFloat(item.totalQty) || 0,
              unitRate: parseFloat(item.unitRate) || 0,
              amount: parseFloat(item.amount) || 0,
              selected: true
            };
          });

          if (mappedItems.length > 0) {
            setItems(mappedItems);
          }
        }
      } catch (err) {
        console.error('Error loading data in QuotationBuilder', err);
        alert('Failed to load quotation details. Customer or quotation may not exist.');
        navigate('/quotations');
      } finally {
        setLoadingCustomer(false);
        setLoadingQuotation(false);
      }
    };

    loadAllData();
  }, [customerId, reviseId, navigate]);


  const availableTypes = [...new Set(approvedItems.map(ai => ai.mainHeading).filter(Boolean))];

  // Unit Options Heuristic
  const getUnitOptions = (mode) => {
    if (mode === 'Meter & MM') return ['SQ.MTR.', 'R.MTR.', 'CU.MTR.', 'NUMBER', 'JOB', 'Others'];
    if (mode === 'Kgs') return ['KGS', 'NUMBER', 'JOB', 'Others'];
    return ['SQ.FT.', 'R.FT.', 'CU.FT.', 'NUMBER', 'JOB', 'Others'];
  };

  // Sync default units on project mode toggle
  const handleProjectUnitChange = (mode) => {
    setProjectUnit(mode);
    const options = getUnitOptions(mode);
    setItems(prev => prev.map(item => {
      const newUnit = options[0];
      const w = parseDimension(item.width);
      const h = parseDimension(item.height);
      const d = parseDimension(item.depth);
      const rate = parseFloat(item.unitRate) || 0;
      const finalNoOfUnit = parseFloat(item.noOfUnit) || 0;

      const qty = calculateQuantity(w, h, d, newUnit);
      const totalQty = qty * finalNoOfUnit;
      return {
        ...item,
        unit: newUnit,
        qty: parseFloat(qty.toFixed(2)),
        totalQty: parseFloat(totalQty.toFixed(2)),
        amount: parseFloat((totalQty * rate).toFixed(2))
      };
    }));
  };

  // Business calculations math helper
  const parseDimension = (val) => {
    if (!val) return 0;
    const s = val.toString().trim();

    let feet = 0;
    let inches = 0;
    let isFtInch = false;

    if (!isNaN(s) && !s.includes("'") && !s.includes('"')) {
      if (projectUnit === 'Ft Inch') {
        const decimalVal = parseFloat(s);
        feet = Math.floor(decimalVal);
        inches = (decimalVal - feet) * 12;
        isFtInch = true;
      } else {
        return parseFloat(s);
      }
    } else if (s.includes("'") || s.toLowerCase().includes("ft")) {
      const parts = s.split(/'|ft/i);
      feet = parseFloat(parts[0]) || 0;
      const inchStr = parts.length > 1 ? parts[1].replace(/["in\s]/gi, '') : "";
      inches = parseFloat(inchStr) || 0;
      isFtInch = true;
    }

    if (isFtInch && projectUnit === 'Ft Inch') {
      // Rounding rules:
      // 0 => 0 inches
      // 0-3 => 3 inches (0.25 ft)
      // 4-6 => 6 inches (0.50 ft)
      // 7-9 => 9 inches (0.75 ft)
      // 10-12 => 12 inches (1.0 ft)
      let roundedInches = 3;
      let ft = feet;
      if (inches === 0) {
        roundedInches = 0;
      } else if (inches <= 3) {
        roundedInches = 3;
      } else if (inches <= 6) {
        roundedInches = 6;
      } else if (inches <= 9) {
        roundedInches = 9;
      } else {
        ft += 1;
        roundedInches = 0;
      }
      return ft + (roundedInches / 12.0);
    }

    // Standard fallback parsing
    if (s.includes("'") || s.toLowerCase().includes("ft")) {
      const parts = s.split(/'|ft/i);
      const ft = parseFloat(parts[0]) || 0;
      const inchStr = parts.length > 1 ? parts[1].replace(/["in\s]/gi, '') : "";
      const inch = parseFloat(inchStr) || 0;
      return ft + (inch / 12.0);
    }
    return parseFloat(s) || 0;
  };

  const formatDimension = (val, itemUnit) => {
    if (val === undefined || val === null) return '';
    const s = val.toString().trim();
    if (!s) return '';

    let decimalVal = parseDimension(s);
    if (decimalVal < 0) decimalVal = 0;

    if (projectUnit === 'Ft Inch') {
      let ft = Math.floor(decimalVal);
      let inches = Math.round((decimalVal - ft) * 12);
      
      // Precision safety guard
      if (inches === 12) {
        ft += 1;
        inches = 0;
      }
      return `${ft}' ${inches}"`;
    }
    return decimalVal.toFixed(2);
  };

  const calculateQuantity = (w, h, d, unitName) => {
    const normUnit = (unitName || '').toUpperCase().replace(/\./g, '').replace(/\s/g, '');
    const dims = [w, h, d];

    if (normUnit.includes('SQFT') || normUnit.includes('SQMTR')) {
      const sorted = [...dims].sort((a, b) => b - a);
      return sorted[0] * sorted[1];
    } else if (normUnit.includes('RFT') || normUnit.includes('RMTR')) {
      return Math.max(...dims);
    } else if (normUnit.includes('CUFT') || normUnit.includes('CUMTR') || 
               normUnit.includes('NO') || normUnit.includes('NUM') || 
               normUnit.includes('JOB')) {
      const product = w * h * d;
      if ((normUnit.includes('NO') || normUnit.includes('NUM') || normUnit.includes('JOB')) && 
          w === 0 && h === 0 && d === 0) {
        return 1;
      }
      return product;
    }
    return 1;
  };

  const handleCellChange = (id, field, value) => {
    setUnitLocked(true);
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };

        // Recompute dimensions & calculations
        const w = parseDimension(field === 'width' ? value : item.width);
        const h = parseDimension(field === 'height' ? value : item.height);
        const d = parseDimension(field === 'depth' ? value : item.depth);
        const unitVal = field === 'unit' ? value : item.unit;
        const rate = parseFloat(field === 'unitRate' ? value : item.unitRate) || 0;
        const noOfUnit = parseFloat(field === 'noOfUnit' ? value : item.noOfUnit) || 0;

        const qty = calculateQuantity(w, h, d, unitVal);
        updated.qty = parseFloat(qty.toFixed(2));
        updated.noOfUnit = field === 'noOfUnit' ? value : item.noOfUnit;
        
        const finalNoOfUnit = parseFloat(updated.noOfUnit) || 0;
        const totalQty = qty * finalNoOfUnit;
        updated.totalQty = parseFloat(totalQty.toFixed(2));
        updated.amount = parseFloat((totalQty * rate).toFixed(2));
        return updated;
      }
      return item;
    }));
  };

  const handleCellBlur = (id, field, value) => {
    if (['width', 'height', 'depth'].includes(field)) {
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          const formatted = formatDimension(value, item.unit);
          const updated = { ...item, [field]: formatted };

          // Recompute dimensions & calculations using the formatted/rounded value
          const w = parseDimension(field === 'width' ? formatted : item.width);
          const h = parseDimension(field === 'height' ? formatted : item.height);
          const d = parseDimension(field === 'depth' ? formatted : item.depth);
          const unitVal = item.unit;
          const rate = parseFloat(item.unitRate) || 0;
          const finalNoOfUnit = parseFloat(item.noOfUnit) || 0;

          const qty = calculateQuantity(w, h, d, unitVal);
          updated.qty = parseFloat(qty.toFixed(2));
          const totalQty = qty * finalNoOfUnit;
          updated.totalQty = parseFloat(totalQty.toFixed(2));
          updated.amount = parseFloat((totalQty * rate).toFixed(2));
          return updated;
        }
        return item;
      }));
    }
  };

  const addRow = () => {
    const options = getUnitOptions(projectUnit);
    const newId = (items.length + 1).toString();
    setItems(prev => [
      ...prev,
      { id: newId, category: '', subcategory: '', otherCategory: '', otherSubcategory: '', subCheckboxes: [], description: '', width: '', height: '', depth: '', unit: options[0], qty: 0, noOfUnit: 1, totalQty: 0, unitRate: 0, amount: 0, selected: true, imageUrl: '' }
    ]);
  };

  const deleteRow = (id) => {
    if (window.confirm('Delete this row?')) {
      const filtered = items.filter(item => item.id !== id);
      setItems(filtered);
      if (filtered.length === 0) {
        setUnitLocked(false);
      }
    }
  };

  const handleApprovedItemSelect = (id, subHeading) => {
    setUnitLocked(true);
    if (!subHeading) {
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            category: '',
            description: '',
            unitRate: 0,
            amount: 0,
            qty: 0,
            noOfUnit: 1,
            totalQty: 0,
            width: '',
            height: '',
            depth: ''
          };
        }
        return item;
      }));
      return;
    }
    const selectedItem = approvedItems.find(ai => ai.subHeading === subHeading);
    if (!selectedItem) return;

    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = {
          ...item,
          category: selectedItem.subHeading,
          description: selectedItem.description,
          unit: selectedItem.unit,
          unitRate: selectedItem.defaultRate
        };

        const w = parseDimension(item.width);
        const h = parseDimension(item.height);
        const d = parseDimension(item.depth);
        const unitVal = selectedItem.unit;
        const rate = parseFloat(selectedItem.defaultRate) || 0;
        const finalNoOfUnit = parseFloat(item.noOfUnit) || 1;

        const qty = calculateQuantity(w, h, d, unitVal);
        updated.qty = parseFloat(qty.toFixed(2));
        const totalQty = qty * finalNoOfUnit;
        updated.totalQty = parseFloat(totalQty.toFixed(2));
        updated.amount = parseFloat((totalQty * rate).toFixed(2));
        return updated;
      }
      return item;
    }));
  };

  const handleTypeChange = (id, newType) => {
    setUnitLocked(true);
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          selectedType: newType,
          category: '',
          description: '',
          unitRate: 0,
          amount: 0,
          qty: 0,
          noOfUnit: 1,
          totalQty: 0,
          width: '',
          height: '',
          depth: ''
        };
      }
      return item;
    }));
  };

  const handleCategoryChange = (id, cat) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          category: cat,
          subCheckboxes: [],
          subcategory: '',
          otherSubcategory: '',
          otherCategory: ''
        };
      }
      return item;
    }));
  };

  const handleSubCheckboxToggle = (id, subVal, checked) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        let updatedChecks = [...item.subCheckboxes];
        if (checked) {
          updatedChecks.push(subVal);
        } else {
          updatedChecks = updatedChecks.filter(v => v !== subVal);
        }

        // Construct comma-separated subcategory label
        const baseSubs = updatedChecks.filter(v => v !== 'Others');
        if (updatedChecks.includes('Others') && item.otherSubcategory) {
          baseSubs.push(item.otherSubcategory);
        } else if (updatedChecks.includes('Others')) {
          baseSubs.push('Others');
        }

        return {
          ...item,
          subCheckboxes: updatedChecks,
          subcategory: baseSubs.join(', ')
        };
      }
      return item;
    }));
  };

  const handleOtherSubchange = (id, val) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const baseSubs = item.subCheckboxes.filter(v => v !== 'Others');
        if (val) {
          baseSubs.push(val);
        } else {
          baseSubs.push('Others');
        }
        return {
          ...item,
          otherSubcategory: val,
          subcategory: baseSubs.join(', ')
        };
      }
      return item;
    }));
  };

  const toggleEditItem = (id) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, isEditing: !it.isEditing } : it));
  };

  const handleImageUpload = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, imageUrl: reader.result };
        }
        return item;
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (id) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, imageUrl: '' };
      }
      return item;
    }));
  };

  // Summary Computations
  const subtotal = items.reduce((sum, item) => sum + (item.selected !== false ? (item.amount || 0) : 0), 0);
  const discount = discountType === 'percent'
    ? parseFloat(((subtotal * discountInputVal) / 100).toFixed(2))
    : discountInputVal;
  const netSubtotal = Math.max(0, subtotal - discount);
  const gstAmount = includeGst ? parseFloat((netSubtotal * 0.18).toFixed(2)) : 0;
  const grandTotal = netSubtotal + gstAmount;

  const preparePayload = () => {
    const validItems = items.filter(it => it.selected !== false && it.category).map(it => {
      let finalCat = it.category;
      if (it.category === 'others') {
        finalCat = it.otherCategory || 'Others';
      } else {
        finalCat = it.category.charAt(0).toUpperCase() + it.category.slice(1);
      }

      return {
        category: finalCat,
        subcategory: it.subcategory,
        description: it.description,
        width: it.width,
        height: it.height,
        depth: it.depth,
        unit: it.unit,
        qty: it.qty,
        noOfUnit: parseFloat(it.noOfUnit) || 1,
        totalQty: it.totalQty,
        unitRate: it.unitRate,
        amount: it.amount
      };
    });

    return {
      customerId,
      projectUnit,
      quotationType,
      subtotal,
      discount,
      discountPercent: discountType === 'percent' ? discountInputVal : null,
      includeGst,
      gstAmount,
      totalAmount: grandTotal,
      items: validItems,
      parentQuotationId
    };
  };

  const handleSaveQuotation = async () => {
    const payload = preparePayload();
    if (payload.items.length === 0) {
      alert('Please add at least one valid item to save the quotation.');
      return;
    }

    setSubmitting(true);
    try {
      await API.post('/quotations', payload);
      alert('Quotation saved successfully!');
      navigate('/quotations');
    } catch (err) {
      console.error('Failed to save quotation', err);
      alert('Error saving quotation estimation sheet.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPreview = () => {
    const payload = preparePayload();
    if (payload.items.length === 0) {
      alert('Please configure at least one item to preview.');
      return;
    }
    setPreviewContent(payload);
    setShowPreview(true);
  };

  const handleDirectPdfDownload = async () => {
    const payload = preparePayload();
    if (payload.items.length === 0) {
      alert('Add items before trying to download a PDF.');
      return;
    }

    setSubmitting(true);
    try {
      // First save to obtain ID, then request pdf download from backend
      const saveRes = await API.post('/quotations', payload);
      const quoteId = saveRes.data.id;

      const pdfRes = await API.get(`/quotations/${quoteId}/pdf`, { responseType: 'blob' });
      const blob = new Blob([pdfRes.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `quotation_${quoteId}.pdf`;
      link.click();
    } catch (err) {
      console.error('Failed to download PDF', err);
      alert('Error rendering PDF.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingQuotation) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}>
        <Navbar />
        <div className="container-fluid py-5 px-lg-5 px-3">
          <div className="card border-0 shadow-lg p-5 text-center bg-white" style={{ borderRadius: '12px' }}>
            <span className="spinner-border text-primary" role="status"></span>
            <p className="mt-2 text-muted small">Retrieving existing quotation details for revision...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <Navbar />

      <div className="container-fluid py-5 px-lg-5 px-3">
        <div className="w-100">
          
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 pb-2">
            <div>
              <h2 className="fw-bold text-dark mb-1" style={{ fontSize: '26px' }}>
                {parentQuotationId ? 'Revise Quotation' : 'Create Quotation'}
              </h2>
              <p className="text-secondary small mb-0">Overview of your Quotation today.</p>
            </div>
            <Link to="/quotations" className="btn btn-light bg-white border fw-semibold px-4" style={{ borderRadius: '8px', color: '#64748b' }}>
              <i className="fas fa-arrow-left me-1"></i> Back
            </Link>
          </div>

          {/* Customer & Project Summary */}
          {loadingCustomer ? (
            <div className="text-center py-4 bg-white rounded-3 shadow-sm mb-4 border">
              <span className="spinner-border text-primary" role="status"></span>
              <p className="mt-2 text-muted small mb-0">Loading customer context...</p>
            </div>
          ) : customer ? (
            <div className="card bg-white border rounded-3 p-4 mb-4 shadow-sm" style={{ borderRadius: '12px' }}>
              <h6 className="fw-bold text-primary mb-4 d-flex align-items-center" style={{ fontSize: '15px' }}>
                <i className="fas fa-user-circle me-2"></i> Client Details &amp; Project Summary
              </h6>
              <div className="row g-4 small mb-4">
                <div className="col-md-3">
                  <span className="text-secondary fw-semibold d-block mb-1" style={{ letterSpacing: '0.03em' }}>CUSTOMER NAME</span>
                  <div className="fw-bold text-dark" style={{ fontSize: '14px' }}>{customer.name}</div>
                </div>
                <div className="col-md-3">
                  <span className="text-secondary fw-semibold d-block mb-1" style={{ letterSpacing: '0.03em' }}>PHONE NUMBER</span>
                  <div className="fw-bold text-dark" style={{ fontSize: '14px' }}>{customer.phone}</div>
                </div>
                <div className="col-md-3">
                  <span className="text-secondary fw-semibold d-block mb-1" style={{ letterSpacing: '0.03em' }}>WORK TYPE</span>
                  <div className="fw-bold text-dark" style={{ fontSize: '14px' }}>{customer.project?.workType || '-'}</div>
                </div>
                <div className="col-md-3">
                  <span className="text-secondary fw-semibold d-block mb-1" style={{ letterSpacing: '0.03em' }}>BUDGET / TIMELINE</span>
                  <div className="fw-bold text-dark" style={{ fontSize: '14px' }}>
                    ₹{customer.project?.budget ? Number(customer.project.budget).toLocaleString() : '-'} | {customer.project?.timeline ? `${customer.project.timeline} Months` : '-'}
                  </div>
                </div>
              </div>

              {/* Project Unit Selector Setting */}
              <div className="border-top pt-4 d-flex align-items-center gap-3">
                <span className="fw-bold text-dark mb-0 small me-2">Project Unit Model:</span>
                <div className="d-flex align-items-center gap-2">
                  {['Ft Inch', 'Meter & MM', 'Kgs', 'Others'].map((mode) => (
                    <div key={mode} className="form-check form-check-inline mb-0 p-0">
                      <input 
                        className="form-check-input d-none" 
                        type="radio" 
                        name="projectUnit" 
                        id={`unit-${mode}`} 
                        value={mode}
                        checked={projectUnit === mode}
                        onChange={() => handleProjectUnitChange(mode)}
                        disabled={unitLocked}
                      />
                      <label 
                        className={`btn btn-sm px-3 py-2 fw-semibold rounded-pill border ${projectUnit === mode ? 'btn-primary' : 'btn-light bg-white text-secondary'}`}
                        htmlFor={`unit-${mode}`}
                        style={{ fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        <span className="me-1">•</span> {mode}
                      </label>
                    </div>
                  ))}
                </div>
                {unitLocked && <span className="text-muted small ms-auto"><i className="fas fa-lock me-1"></i> Mode locked (table active)</span>}
              </div>

              {/* Pricing Category Selector */}
              <div className="border-top pt-4 mt-3 d-flex align-items-center gap-3">
                <span className="fw-bold text-dark mb-0 small me-2">Pricing Category:</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: '220px', borderRadius: '8px' }}
                  value={quotationType}
                  onChange={(e) => {
                    setQuotationType(e.target.value);
                    fetchApprovedItems(e.target.value);
                  }}
                >
                  <option value="BUDGET_QUOTE">Budget Quote</option>
                  <option value="PREMIUM_RANGE_QUOTE">Premium Range Quote</option>
                  <option value="ULTRA_LUXURY_QUOTE">Ultra Luxury Quote</option>
                </select>
                <span className="text-secondary small ms-2"><i className="fas fa-info-circle me-1"></i> Filters items to selected price category</span>
              </div>
            </div>
          ) : null}

          {/* Items Section */}
          <div className="bg-white border rounded-3 p-4 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '18px' }}>Quotation Items</h5>
                <p className="text-secondary small mb-0">Add and manage all items for this quotation.</p>
              </div>
              <button className="btn btn-outline-primary fw-semibold btn-sm px-3 py-2" onClick={addRow} style={{ borderRadius: '8px' }}>
                <i className="fas fa-plus me-1"></i> Add New Item
              </button>
            </div>

            <div className="table-responsive mb-3 border rounded">
              <table className="table table-hover mb-0 align-middle">
                <thead>
                  <tr className="text-secondary border-bottom bg-light small" style={{ fontSize: '12px', height: '45px' }}>
                    <th style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        className="form-check-input ms-2"
                        checked={items.length > 0 && items.every(it => it.selected !== false)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setItems(prev => prev.map(it => ({ ...it, selected: checked })));
                        }}
                        title="Select/Deselect all rows for calculation"
                      />
                    </th>
                    <th style={{ width: '60px' }} className="text-center">S.NO</th>
                    <th style={{ minWidth: '300px' }}>DESCRIPTION</th>
                    <th style={{ width: '180px' }}>DIMENSIONS</th>
                    <th style={{ width: '150px' }}>QUANTITY</th>
                    <th style={{ width: '150px' }}>RATE</th>
                    <th style={{ width: '150px' }} className="text-end pe-3">AMOUNT</th>
                    <th style={{ width: '80px' }} className="text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const subOptions = CATEGORY_MAP[item.category] || [];
                    const isOthersSubChecked = item.subCheckboxes.includes('Others');
                    const isSelected = item.selected !== false;
                    const isEditing = item.isEditing === true;

                    const filteredApprovedItems = item.selectedType
                      ? approvedItems.filter(ai => ai.mainHeading === item.selectedType)
                      : approvedItems;

                    return (
                      <React.Fragment key={item.id}>
                        <tr 
                          className="small border-bottom"
                          style={!isSelected ? { opacity: 0.5, backgroundColor: '#f8f9fa' } : {}}
                        >
                          <td>
                            <input 
                              type="checkbox" 
                              className="form-check-input ms-2"
                              checked={isSelected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setItems(prev => prev.map(it => it.id === item.id ? { ...it, selected: checked } : it));
                              }}
                            />
                          </td>
                          <td className="text-center fw-bold text-secondary">{index + 1}</td>
                          <td>
                            <div className="d-flex flex-column">
                              <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>
                                {item.category || "Select Category"}
                              </span>
                              <span className="text-secondary small">
                                {item.selectedType || "All Category Types"}
                              </span>
                              <button 
                                type="button" 
                                className="btn btn-link btn-sm text-primary p-0 border-0 mt-1 text-start fw-semibold"
                                onClick={() => toggleEditItem(item.id)}
                                style={{ textDecoration: 'none', fontSize: '12px' }}
                              >
                                + Specifications
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span className="text-dark">
                                {item.width && item.height ? (
                                  `${formatDimension(item.width, item.unit)} × ${formatDimension(item.height, item.unit)}${item.depth ? ` × ${formatDimension(item.depth, item.unit)}` : ''}`
                                ) : (
                                  "0.00 × 0.00"
                                )}
                              </span>
                              <button 
                                type="button" 
                                className="btn btn-link btn-sm text-secondary p-0 border-0"
                                onClick={() => toggleEditItem(item.id)}
                              >
                                <i className="fas fa-pencil-alt small"></i>
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-column">
                              <span className="fw-semibold text-dark">{Number(item.qty).toFixed(2)} {item.unit}</span>
                              <span className="text-secondary small">({item.noOfUnit} No.)</span>
                            </div>
                          </td>
                          <td>
                            <span className="text-dark">₹{Number(item.unitRate || 0).toFixed(2)} / {item.unit}</span>
                          </td>
                          <td className="text-end fw-bold text-dark pe-3">
                            ₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="text-center">
                            <button 
                              type="button" 
                              className="btn btn-link btn-sm text-secondary p-0 border-0"
                              onClick={() => toggleEditItem(item.id)}
                            >
                              <i className={`fas fa-chevron-${isEditing ? 'up' : 'down'}`}></i>
                            </button>
                          </td>
                        </tr>

                        {isEditing && (
                          <tr className="bg-light">
                            <td colSpan="8" className="p-3">
                              <div className="card shadow-sm border rounded-3 p-4 bg-white">
                                <div className="row g-3 mb-3">
                                  {/* Left Side fields */}
                                  <div className="col-md-8">
                                    <div className="row g-3">
                                      <div className="col-md-6">
                                        <label className="form-label small fw-bold text-secondary mb-1">Sub Heading</label>
                                        <select 
                                          className="form-select border" 
                                          value={item.selectedType || ''}
                                          onChange={(e) => handleTypeChange(item.id, e.target.value)}
                                          style={{ height: '40px', borderRadius: '6px', fontSize: '13px' }}
                                        >
                                          <option value="">Choose Sub Heading...</option>
                                          {availableTypes.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                          ))}
                                        </select>
                                      </div>
                                      
                                      <div className="col-md-6">
                                        <label className="form-label small fw-bold text-secondary mb-1">Category</label>
                                        <select 
                                          className="form-select border" 
                                          value={item.category}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            if (['partitions', 'doors', 'windows', 'ceilings', 'others'].includes(val)) {
                                              handleCategoryChange(item.id, val);
                                            } else {
                                              handleApprovedItemSelect(item.id, val);
                                            }
                                          }}
                                          style={{ height: '40px', borderRadius: '6px', fontSize: '13px' }}
                                        >
                                          <option value="">Select Category...</option>
                                          
                                          {filteredApprovedItems.length > 0 && (
                                            <optgroup label="Pre-approved Categories">
                                              {filteredApprovedItems.map((ai, idx) => (
                                                <option key={idx} value={ai.subHeading}>
                                                  {ai.subHeading} {ai.isNew ? '(New)' : ''}
                                                </option>
                                              ))}
                                            </optgroup>
                                          )}

                                          <optgroup label="Custom Categories">
                                            <option value="partitions">Partitions</option>
                                            <option value="doors">Doors</option>
                                            <option value="windows">Windows</option>
                                            <option value="ceilings">Ceilings</option>
                                            <option value="others">Others</option>
                                          </optgroup>
                                        </select>
                                      </div>

                                      {item.category === 'others' && (
                                        <div className="col-md-12">
                                          <label className="form-label small fw-bold text-secondary mb-1">Specify Custom Category</label>
                                          <input 
                                            type="text" 
                                            className="form-control border"
                                            placeholder="Custom Category Name"
                                            value={item.otherCategory}
                                            onChange={(e) => handleCellChange(item.id, 'otherCategory', e.target.value)}
                                            style={{ height: '40px', borderRadius: '6px', fontSize: '13px' }}
                                          />
                                        </div>
                                      )}

                                      <div className="col-md-12">
                                        <label className="form-label small fw-bold text-secondary mb-1">Additional Specifications</label>
                                        <textarea 
                                          className="form-control border" 
                                          rows="2"
                                          placeholder="Enter details..."
                                          value={item.description}
                                          onChange={(e) => handleCellChange(item.id, 'description', e.target.value)}
                                          style={{ borderRadius: '6px', fontSize: '13px' }}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right Side Add Image */}
                                  <div className="col-md-4 d-flex flex-column align-items-center justify-content-center border-start">
                                    {item.imageUrl ? (
                                      <div className="position-relative w-100 text-center" style={{ height: '150px' }}>
                                        <img 
                                          src={item.imageUrl} 
                                          alt="Preview" 
                                          className="img-thumbnail w-100 h-100" 
                                          style={{ objectFit: 'contain' }}
                                        />
                                        <button 
                                          type="button" 
                                          className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1 rounded-circle p-1 d-flex align-items-center justify-content-center"
                                          onClick={() => handleRemoveImage(item.id)}
                                          style={{ width: '24px', height: '24px', fontSize: '10px' }}
                                          title="Remove Image"
                                        >
                                          <i className="fas fa-times"></i>
                                        </button>
                                      </div>
                                    ) : (
                                      <label 
                                        className="border border-dashed rounded-3 p-4 text-center bg-light w-100 d-flex flex-column align-items-center justify-content-center" 
                                        style={{ height: '150px', cursor: 'pointer' }}
                                      >
                                        <input 
                                          type="file" 
                                          className="d-none" 
                                          accept="image/*"
                                          onChange={(e) => handleImageUpload(item.id, e.target.files[0])}
                                        />
                                        <i className="fas fa-image fa-2x text-muted mb-2"></i>
                                        <span className="small text-muted fw-semibold">Add Image</span>
                                      </label>
                                    )}
                                  </div>
                                </div>

                                {/* Dimensions header & inputs */}
                                <h6 className="fw-bold text-secondary border-bottom pb-2 mb-3 mt-4 small" style={{ letterSpacing: '0.05em' }}>
                                  <i className="fas fa-arrows-alt me-1 text-primary"></i> DIMENSIONS
                                </h6>
                                
                                <div className="row g-3 align-items-end">
                                  <div className="col-md-2">
                                    <label className="form-label small fw-bold text-secondary mb-1">Width</label>
                                    <input 
                                      type="text" 
                                      className="form-control border text-center" 
                                      value={item.width}
                                      placeholder="Width"
                                      onChange={(e) => handleCellChange(item.id, 'width', e.target.value)}
                                      onBlur={(e) => handleCellBlur(item.id, 'width', e.target.value)}
                                      style={{ height: '40px', borderRadius: '6px', fontSize: '13px' }}
                                    />
                                  </div>
                                  
                                  <div className="col-md-2">
                                    <label className="form-label small fw-bold text-secondary mb-1">Height</label>
                                    <input 
                                      type="text" 
                                      className="form-control border text-center" 
                                      value={item.height}
                                      placeholder="Height"
                                      onChange={(e) => handleCellChange(item.id, 'height', e.target.value)}
                                      onBlur={(e) => handleCellBlur(item.id, 'height', e.target.value)}
                                      style={{ height: '40px', borderRadius: '6px', fontSize: '13px' }}
                                    />
                                  </div>

                                  <div className="col-md-2">
                                    <label className="form-label small fw-bold text-secondary mb-1">Depth</label>
                                    <input 
                                      type="text" 
                                      className="form-control border text-center" 
                                      value={item.depth}
                                      placeholder="Depth"
                                      onChange={(e) => handleCellChange(item.id, 'depth', e.target.value)}
                                      onBlur={(e) => handleCellBlur(item.id, 'depth', e.target.value)}
                                      style={{ height: '40px', borderRadius: '6px', fontSize: '13px' }}
                                    />
                                  </div>

                                  <div className="col-md-2">
                                    <label className="form-label small fw-bold text-secondary mb-1">Unit</label>
                                    <select 
                                      className="form-select border" 
                                      value={item.unit}
                                      onChange={(e) => handleCellChange(item.id, 'unit', e.target.value)}
                                      style={{ height: '40px', borderRadius: '6px', fontSize: '13px' }}
                                    >
                                      {getUnitOptions(projectUnit).map(u => (
                                        <option key={u} value={u}>{u}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="col-md-2">
                                    <label className="form-label small fw-bold text-secondary mb-1">Quantity</label>
                                    <input 
                                      type="text" 
                                      className="form-control border text-center bg-light font-monospace" 
                                      value={item.qty}
                                      readOnly
                                      style={{ height: '40px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}
                                    />
                                  </div>

                                  <div className="col-md-2">
                                    <label className="form-label small fw-bold text-secondary mb-1">Nos.</label>
                                    <input 
                                      type="number" 
                                      className="form-control border text-center" 
                                      value={item.noOfUnit}
                                      onChange={(e) => handleCellChange(item.id, 'noOfUnit', e.target.value)}
                                      style={{ height: '40px', borderRadius: '6px', fontSize: '13px' }}
                                    />
                                  </div>
                                </div>

                                <div className="row g-3 align-items-center mt-3 border-top pt-3">
                                  <div className="col-md-5">
                                    <div className="row g-2">
                                      <div className="col-md-6">
                                        <label className="form-label small fw-bold text-secondary mb-1">Rate (₹)</label>
                                        <input 
                                          type="number" 
                                          className="form-control border" 
                                          value={item.unitRate}
                                          onChange={(e) => handleCellChange(item.id, 'unitRate', e.target.value)}
                                          style={{ height: '40px', borderRadius: '6px', fontSize: '13px' }}
                                        />
                                      </div>
                                      <div className="col-md-6">
                                        <label className="form-label small fw-bold text-secondary mb-1">Amount (₹)</label>
                                        <div className="form-control bg-light border fw-bold text-end" style={{ height: '40px', borderRadius: '6px', fontSize: '13px', lineHeight: '26px' }}>
                                          ₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="col-md-7 text-end">
                                    <button 
                                      type="button" 
                                      className="btn btn-outline-danger me-2" 
                                      onClick={() => deleteRow(item.id)}
                                      style={{ borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}
                                    >
                                      <i className="fas fa-trash me-1"></i> Delete
                                    </button>
                                    <button 
                                      type="button" 
                                      className="btn btn-light border me-2" 
                                      onClick={() => toggleEditItem(item.id)}
                                      style={{ borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}
                                    >
                                      Cancel
                                    </button>
                                    <button 
                                      type="button" 
                                      className="btn btn-primary px-4" 
                                      onClick={() => toggleEditItem(item.id)}
                                      style={{ borderRadius: '8px', fontSize: '13px', fontWeight: '600', backgroundColor: '#2563eb', border: 'none' }}
                                    >
                                      Save Item
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-center py-2 border-top">
              <button type="button" className="btn btn-light border fw-semibold px-4 text-secondary small" onClick={addRow} style={{ borderRadius: '8px' }}>
                + Add New Item
              </button>
            </div>
          </div>

          {/* Summary Details */}
          {items.length > 0 && (
            <div className="bg-white border rounded-3 p-4 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
              <div className="row justify-content-end">
                <div className="col-md-5">
                  <div className="d-flex justify-content-between mb-3 align-items-center">
                    <span className="text-secondary fw-semibold small">Subtotal</span>
                    <span className="fw-bold text-dark fs-6">₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-secondary fw-semibold small">Discount</span>
                    <div className="d-flex align-items-center gap-2">
                      <div className="input-group" style={{ width: '130px' }}>
                        <input 
                          type="number" 
                          className="form-control text-end fw-semibold border-end-0" 
                          style={{ height: '36px', fontSize: '13px', borderRadius: '6px 0 0 6px' }}
                          value={discountInputVal || ''}
                          min="0"
                          max={discountType === 'percent' ? 100 : undefined}
                          placeholder="0"
                          onChange={e => {
                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                            if (discountType === 'percent') {
                              setDiscountInputVal(Math.min(100, val));
                            } else {
                              setDiscountInputVal(val);
                            }
                          }}
                        />
                        <button 
                          className={`btn btn-outline-secondary px-2 ${discountType === 'percent' ? 'bg-primary text-white border-primary' : 'bg-light text-dark'}`}
                          type="button" 
                          onClick={() => setDiscountType(discountType === 'percent' ? 'flat' : 'percent')}
                          style={{ fontSize: '12px', height: '36px', borderRadius: '0 6px 6px 0' }}
                        >
                          {discountType === 'percent' ? '%' : '₹'}
                        </button>
                      </div>
                      {discount > 0 && (
                        <span className="text-danger small fw-semibold">-₹{discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      )}
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="form-check p-0 mb-0 d-flex align-items-center">
                      <input 
                        className="form-check-input ms-0 me-2" 
                        type="checkbox" 
                        id="gstCheck"
                        checked={includeGst}
                        onChange={e => setIncludeGst(e.target.checked)}
                      />
                      <label className="form-check-label text-secondary fw-semibold small" htmlFor="gstCheck">Inclusive GST (18%)</label>
                    </div>
                    <span className="fw-semibold text-dark">₹{gstAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="d-flex justify-content-between pt-3 mt-3 border-top align-items-center">
                    <span className="fw-bold text-dark fs-5">GRAND TOTAL</span>
                    <span className="fw-bold text-primary fs-4">₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer Buttons */}
          {items.length > 0 && (
            <div className="d-flex justify-content-end gap-3 flex-wrap mt-4">
              <button className="btn btn-outline-primary fw-semibold py-2 px-4" onClick={handleOpenPreview} style={{ borderRadius: '8px' }}>
                <i className="fas fa-eye me-1"></i> View Quotation
              </button>
              <button 
                className="btn btn-outline-secondary fw-semibold py-2 px-4" 
                onClick={handleDirectPdfDownload}
                disabled={submitting}
                style={{ borderRadius: '8px' }}
              >
                {submitting ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="fas fa-file-pdf me-1"></i>}
                Download PDF
              </button>
              <button 
                className="btn btn-primary fw-semibold py-2 px-4" 
                onClick={handleSaveQuotation}
                disabled={submitting}
                style={{ borderRadius: '8px', backgroundColor: '#2563eb', border: 'none' }}
              >
                {submitting ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="fas fa-save me-1"></i>}
                {parentQuotationId ? 'Save & Go Back' : 'Save & Go Back'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* HTML Quotation Preview Modal */}
      {showPreview && previewContent && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold"><i className="fas fa-file-invoice-dollar me-1"></i> Quotation Sheet Preview</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPreview(false)}></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <div className="bg-white p-4 shadow-sm rounded border" style={{ fontFamily: 'Arial, sans-serif' }}>
                  
                  {/* Banner */}
                  <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                    <div>
                      <h2 className="text-primary fw-bold mb-0">QUOTATION</h2>
                      <span className="text-muted small">SowInfra Estimation Sheet</span>
                    </div>
                    <div className="text-end">
                      <h5 className="fw-bold text-primary mb-0">NEOSOW INFRA</h5>
                      <span className="text-muted small" style={{ fontSize: '11px' }}>support@neosow.com</span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="row mb-4">
                    <div className="col-6">
                      <h6 className="text-primary fw-bold border-bottom pb-1 mb-2">BILL TO:</h6>
                      <div className="fw-bold">{customer?.name}</div>
                      <div className="text-secondary small">{customer?.phone}</div>
                      <div className="text-secondary small">{customer?.address}</div>
                    </div>
                    <div className="col-6 text-end">
                      <h6 className="text-primary fw-bold border-bottom pb-1 mb-2">QUOTE DETAILS:</h6>
                      <div className="small"><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                      <div className="small"><strong>Unit Setting:</strong> {projectUnit}</div>
                      {customer?.project && <div className="small"><strong>Work Type:</strong> {customer.project.workType}</div>}
                    </div>
                  </div>

                  {/* Table */}
                  <table className="table table-bordered table-sm small align-middle mb-4">
                    <thead>
                      <tr className="table-primary text-center">
                        <th>S.No</th>
                        <th>Description</th>
                        <th>Width</th>
                        <th>Height</th>
                        <th>Depth</th>
                        <th>Unit</th>
                        <th>Qty</th>
                        <th>Nos</th>
                        <th>Total Qty.</th>
                        <th>Rate</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewContent.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="text-center">{idx + 1}</td>
                          <td>
                            <strong>{it.category}</strong>
                            {it.subcategory && ` - ${it.subcategory}`}
                            {it.description && <div className="text-muted" style={{ fontSize: '10px' }}>{it.description}</div>}
                          </td>
                          <td className="text-center">{it.width || '-'}</td>
                          <td className="text-center">{it.height || '-'}</td>
                          <td className="text-center">{it.depth || '-'}</td>
                          <td className="text-center">{it.unit}</td>
                          <td className="text-center">{it.qty}</td>
                          <td className="text-center">{it.noOfUnit}</td>
                          <td className="text-center fw-bold">{it.totalQty}</td>
                          <td className="text-end">₹{Number(it.unitRate).toFixed(2)}</td>
                          <td className="text-end fw-bold">₹{Number(it.amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Summary Block */}
                  <div className="d-flex justify-content-end mb-4">
                    <table className="table table-sm border-0 mb-0" style={{ width: '280px' }}>
                      <tbody>
                        <tr className="border-0">
                          <td className="border-0">Subtotal:</td>
                          <td className="text-end border-0">₹{subtotal.toFixed(2)}</td>
                        </tr>
                        {discount > 0 && (
                          <tr className="border-0 text-danger">
                            <td className="border-0">{discountType === 'percent' ? `Discount (${discountInputVal}%):` : 'Discount:'}</td>
                            <td className="text-end border-0">-₹{discount.toFixed(2)}</td>
                          </tr>
                        )}
                        {includeGst && (
                          <tr className="border-top">
                            <td className="border-0">GST (18%):</td>
                            <td className="text-end border-0">₹{gstAmount.toFixed(2)}</td>
                          </tr>
                        )}
                        <tr className="table-primary fw-bold text-primary border-top fs-6">
                          <td>GRAND TOTAL:</td>
                          <td className="text-end">₹{grandTotal.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Terms */}
                  <div className="bg-light p-3 rounded border-start border-primary border-4" style={{ fontSize: '11px' }}>
                    <strong>Terms &amp; Conditions:</strong> Valid for 30 days. Confirm via email. Thank you for your business!
                  </div>

                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary fw-bold" onClick={() => setShowPreview(false)}>Close Preview</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeDescriptionPopup && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold"><i className="fas fa-file-alt me-2"></i> Edit Description</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setActiveDescriptionPopup(null)}></button>
              </div>
              <div className="modal-body p-3">
                <textarea
                  className="form-control"
                  rows="8"
                  value={activeDescriptionPopup.text}
                  onChange={(e) => {
                    const newText = e.target.value;
                    setActiveDescriptionPopup(prev => ({ ...prev, text: newText }));
                    handleCellChange(activeDescriptionPopup.itemId, 'description', newText);
                  }}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-primary fw-bold w-100" onClick={() => setActiveDescriptionPopup(null)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
