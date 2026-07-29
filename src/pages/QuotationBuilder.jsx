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
    { id: '1', category: '', subcategory: '', otherCategory: '', otherSubcategory: '', subCheckboxes: [], description: '', width: '', height: '', depth: '', unit: 'SQ.FT.', qty: 0, noOfUnit: 1, totalQty: 0, unitRate: 0, amount: 0, selected: true }
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
        let fetchedApproved = [];
        try {
          const boqRes = await API.get('/boq/approved');
          const rawItems = boqRes.data || [];
          const seen = new Set();
          fetchedApproved = rawItems.filter(item => {
            if (!item.subHeading) return false;
            const key = item.subHeading.toLowerCase().trim();
            const duplicate = seen.has(key);
            seen.add(key);
            return !duplicate;
          });
          setApprovedItems(fetchedApproved);
        } catch (err) {
          console.error('Failed to fetch approved BOQ categories', err);
        }

        // 3. Fetch quotation if revising
        if (reviseId) {
          const quoteRes = await API.get(`/quotations/${reviseId}`);
          const qData = quoteRes.data || {};

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
      // 0-3 => 3 inches (0.25 ft)
      // 4-6 => 6 inches (0.50 ft)
      // 7-9 => 9 inches (0.75 ft)
      // 10-12 => 12 inches (1.0 ft)
      let roundedInches = 3;
      let ft = feet;
      if (inches <= 3) {
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
      { id: newId, category: '', subcategory: '', otherCategory: '', otherSubcategory: '', subCheckboxes: [], description: '', width: '', height: '', depth: '', unit: options[0], qty: 0, noOfUnit: 1, totalQty: 0, unitRate: 0, amount: 0, selected: true }
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
        <div className="container py-5">
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <Navbar />

      <div className="container py-5">
        <div className="card border-0 shadow-lg p-4 mx-auto" style={{ borderRadius: '12px', maxWidth: '1200px', background: 'white' }}>
          
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
            <h2 className="text-primary fw-bold mb-0">
              <i className="fas fa-file-invoice me-2"></i> {parentQuotationId ? 'Revise Quotation' : 'Create Quotation'}
            </h2>
            <Link to="/quotations" className="btn btn-outline-secondary fw-semibold">
              <i className="fas fa-arrow-left me-1"></i> Back
            </Link>
          </div>

          {/* Customer & Project Summary */}
          {loadingCustomer ? (
            <div className="text-center py-4">
              <span className="spinner-border text-primary" role="status"></span>
              <p className="mt-2 text-muted small">Loading customer context...</p>
            </div>
          ) : customer ? (
            <div className="card bg-light border-0 p-3 mb-4" style={{ borderRadius: '8px' }}>
              <h6 className="fw-bold text-primary mb-3"><i className="fas fa-user-circle me-1"></i> Client Details &amp; Project Summary</h6>
              <div className="row g-3 small">
                <div className="col-md-3">
                  <span className="text-secondary">Customer Name:</span>
                  <div className="fw-bold text-dark">{customer.name}</div>
                </div>
                <div className="col-md-3">
                  <span className="text-secondary">Phone Number:</span>
                  <div className="fw-bold text-dark">{customer.phone}</div>
                </div>
                <div className="col-md-3">
                  <span className="text-secondary">Work Type:</span>
                  <div className="fw-bold text-dark">{customer.project?.workType || '-'}</div>
                </div>
                <div className="col-md-3">
                  <span className="text-secondary">Budget / Timeline:</span>
                  <div className="fw-bold text-dark">
                    ₹{customer.project?.budget ? Number(customer.project.budget).toLocaleString() : '-'} | {customer.project?.timeline || '-'}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Project Unit Selector Setting */}
          <div className="border rounded p-3 mb-4 bg-light d-flex align-items-center gap-3">
            <span className="fw-bold text-dark mb-0 small">Project Unit Mode:</span>
            {['Ft Inch', 'Meter & MM', 'Kgs', 'Others'].map((mode) => (
              <div key={mode} className="form-check form-check-inline mb-0">
                <input 
                  className="form-check-input" 
                  type="radio" 
                  name="projectUnit" 
                  id={`unit-${mode}`} 
                  value={mode}
                  checked={projectUnit === mode}
                  onChange={() => handleProjectUnitChange(mode)}
                  disabled={unitLocked}
                />
                <label className="form-check-label small fw-semibold" htmlFor={`unit-${mode}`}>{mode}</label>
              </div>
            ))}
            {unitLocked && <span className="text-muted small ms-auto"><i className="fas fa-lock me-1"></i> Mode locked (table active)</span>}
          </div>

          {/* Items Table */}
          <div className="table-responsive mb-3 border rounded">
            <table className="table table-bordered table-hover mb-0 align-middle" style={{ minWidth: '950px' }}>
              <thead className="table-primary text-secondary">
                <tr className="small text-center">
                  <th style={{ width: '50px' }}>S.No</th>
                  <th style={{ width: '45px' }}>
                    <input 
                      type="checkbox" 
                      className="form-check-input"
                      checked={items.length > 0 && items.every(it => it.selected !== false)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setItems(prev => prev.map(it => ({ ...it, selected: checked })));
                      }}
                      title="Select/Deselect all rows for calculation"
                    />
                  </th>
                  <th style={{ minWidth: '280px' }}>Description &amp; Categories</th>
                  <th style={{ width: '90px' }}>Width</th>
                  <th style={{ width: '90px' }}>Height</th>
                  <th style={{ width: '90px' }}>Depth</th>
                  <th style={{ width: '110px' }}>Unit</th>
                  <th style={{ width: '90px' }}>Qty</th>
                  <th style={{ width: '80px' }}>Nos</th>
                  <th style={{ width: '95px' }}>Total Qty.</th>
                  <th style={{ width: '120px' }}>Rate (₹)</th>
                  <th style={{ width: '130px' }}>Amount (₹)</th>
                  <th style={{ width: '60px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const subOptions = CATEGORY_MAP[item.category] || [];
                  const isOthersSubChecked = item.subCheckboxes.includes('Others');

                  const filteredApprovedItems = item.selectedType
                    ? approvedItems.filter(ai => ai.mainHeading === item.selectedType)
                    : approvedItems;

                  const isSelected = item.selected !== false;

                  return (
                    <tr 
                      key={item.id} 
                      className="small"
                      style={!isSelected ? { opacity: 0.5, backgroundColor: '#f8f9fa' } : {}}
                    >
                      <td className="text-center fw-bold text-secondary">{index + 1}</td>
                      <td className="text-center">
                        <input 
                          type="checkbox" 
                          className="form-check-input"
                          checked={isSelected}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setItems(prev => prev.map(it => it.id === item.id ? { ...it, selected: checked } : it));
                          }}
                          title={isSelected ? "Uncheck to exclude from calculations" : "Check to include in calculations"}
                        />
                      </td>
                      <td>
                        {/* Type Select */}
                        <select 
                          className="form-select form-select-sm mb-2" 
                          value={item.selectedType || ''}
                          onChange={(e) => handleTypeChange(item.id, e.target.value)}
                        >
                          <option value="">All Category Types...</option>
                          {availableTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>

                        {/* Category Select */}
                        <select 
                          className="form-select form-select-sm mb-2" 
                          value={item.category}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (['partitions', 'doors', 'windows', 'ceilings', 'others'].includes(val)) {
                              handleCategoryChange(item.id, val);
                            } else {
                              handleApprovedItemSelect(item.id, val);
                            }
                          }}
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

                        {item.category && !['partitions', 'doors', 'windows', 'ceilings', 'others'].includes(item.category) && (
                          <div className="text-secondary fw-semibold mb-2 small p-2 bg-light rounded border-start border-primary border-3" style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.3' }}>
                            {item.category}
                          </div>
                        )}

                        {item.category === 'others' && (
                          <textarea 
                            className="form-control form-control-sm mb-2" 
                            placeholder="Specify custom category"
                            rows="2"
                            value={item.otherCategory}
                            onChange={(e) => handleCellChange(item.id, 'otherCategory', e.target.value)}
                            style={{ resize: 'vertical', minHeight: '50px' }}
                          />
                        )}

                        {/* Subcategory Checkboxes */}
                        {subOptions.length > 0 && (
                          <div className="border rounded p-2 mb-2 bg-light" style={{ maxHeight: '90px', overflowY: 'auto' }}>
                            {subOptions.map(sub => (
                              <div key={sub} className="form-check form-check-inline mb-1">
                                <input 
                                  className="form-check-input" 
                                  type="checkbox" 
                                  id={`chk-${item.id}-${sub}`}
                                  value={sub}
                                  checked={item.subCheckboxes.includes(sub)}
                                  onChange={(e) => handleSubCheckboxToggle(item.id, sub, e.target.checked)}
                                />
                                <label className="form-check-label" style={{ fontSize: '11px' }} htmlFor={`chk-${item.id}-${sub}`}>{sub}</label>
                              </div>
                            ))}
                          </div>
                        )}

                        {isOthersSubChecked && (
                          <textarea 
                            className="form-control form-control-sm mb-2" 
                            placeholder="Specify custom subcategory"
                            rows="2"
                            value={item.otherSubcategory}
                            onChange={(e) => handleOtherSubchange(item.id, e.target.value)}
                            style={{ resize: 'vertical', minHeight: '50px' }}
                          />
                        )}

                        {/* Additional notes */}
                        <div className="d-flex align-items-center gap-1">
                          <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            placeholder="Additional specifications"
                            value={item.description}
                            onChange={(e) => handleCellChange(item.id, 'description', e.target.value)}
                          />
                          <button 
                            type="button" 
                            className="btn btn-sm btn-outline-primary px-2 py-1"
                            onClick={() => setActiveDescriptionPopup({ itemId: item.id, text: item.description })}
                            title="See full description"
                            style={{ fontSize: '11px', whiteSpace: 'nowrap' }}
                          >
                            See More
                          </button>
                        </div>
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="form-control form-control-sm text-center" 
                          style={{ minWidth: '70px' }}
                          value={item.width}
                          onChange={(e) => handleCellChange(item.id, 'width', e.target.value)}
                          onBlur={(e) => handleCellBlur(item.id, 'width', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="form-control form-control-sm text-center" 
                          style={{ minWidth: '70px' }}
                          value={item.height}
                          onChange={(e) => handleCellChange(item.id, 'height', e.target.value)}
                          onBlur={(e) => handleCellBlur(item.id, 'height', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="form-control form-control-sm text-center" 
                          style={{ minWidth: '70px' }}
                          value={item.depth}
                          onChange={(e) => handleCellChange(item.id, 'depth', e.target.value)}
                          onBlur={(e) => handleCellBlur(item.id, 'depth', e.target.value)}
                        />
                      </td>
                      <td>
                        <select 
                          className="form-select form-select-sm" 
                          style={{ minWidth: '95px' }}
                          value={item.unit}
                          onChange={(e) => handleCellChange(item.id, 'unit', e.target.value)}
                        >
                          {getUnitOptions(projectUnit).map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </td>
                      <td className="text-center fw-bold bg-light">{item.qty.toFixed(2)}</td>
                      <td>
                        <input 
                          type="number" 
                          className="form-control form-control-sm text-center" 
                          style={{ minWidth: '70px' }}
                          value={item.noOfUnit}
                          min="0"
                          step="0.01"
                          onChange={(e) => handleCellChange(item.id, 'noOfUnit', e.target.value)}
                        />
                      </td>
                      <td className="text-center fw-bold bg-light">{(item.totalQty || 0).toFixed(2)}</td>
                      <td>
                        <input 
                          type="number" 
                          className="form-control form-control-sm text-end" 
                          style={{ minWidth: '100px' }}
                          value={item.unitRate}
                          min="0"
                          step="0.01"
                          onChange={(e) => handleCellChange(item.id, 'unitRate', e.target.value)}
                        />
                      </td>
                      <td className="text-end fw-bold bg-light">₹{item.amount.toFixed(2)}</td>
                      <td className="text-center">
                        <button className="btn btn-sm btn-outline-danger border-0" onClick={() => deleteRow(item.id)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button className="btn btn-outline-primary fw-bold btn-sm mb-4 px-3" onClick={addRow}>
            <i className="fas fa-plus me-1"></i> Add New Item
          </button>

          {/* Summary Details */}
          {items.length > 0 && (
            <div className="card text-white p-4 mb-4 border-0" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '10px'
            }}>
              <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                <span className="fw-semibold">Subtotal:</span>
                <span className="fw-bold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                <span className="fw-semibold">Discount:</span>
                <div className="d-flex align-items-center gap-2">
                  {discountType === 'percent' && discount > 0 && (
                    <span className="small text-white-50 fw-semibold me-1">(-₹{discount.toFixed(2)})</span>
                  )}
                  <select 
                    className="form-select form-select-sm fw-bold text-dark" 
                    style={{ width: '65px', borderRadius: '4px' }}
                    value={discountType}
                    onChange={e => {
                      setDiscountType(e.target.value);
                      setDiscountInputVal(0);
                    }}
                  >
                    <option value="flat">₹</option>
                    <option value="percent">%</option>
                  </select>
                  <input 
                    type="number" 
                    className="form-control form-control-sm text-end fw-bold" 
                    style={{ width: '100px', borderRadius: '4px' }}
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
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                <div className="form-check p-0 mb-0">
                  <input 
                    className="form-check-input ms-0 me-2" 
                    type="checkbox" 
                    id="gstCheck"
                    checked={includeGst}
                    onChange={e => setIncludeGst(e.target.checked)}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="gstCheck">Include GST (18%)</label>
                </div>
                <span className="fw-bold">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between pt-2 fs-5">
                <span className="fw-bold">GRAND TOTAL:</span>
                <span className="fw-bold text-warning">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Action Footer Buttons */}
          {items.length > 0 && (
            <div className="d-flex gap-3 flex-wrap">
              <button className="btn btn-success fw-bold py-2 px-4 flex-grow-1" onClick={handleOpenPreview}>
                <i className="fas fa-eye me-1"></i> View Quotation
              </button>
              <button 
                className="btn btn-warning text-white fw-bold py-2 px-4 flex-grow-1" 
                onClick={handleDirectPdfDownload}
                disabled={submitting}
              >
                {submitting ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="fas fa-file-pdf me-1"></i>}
                Download PDF
              </button>
              <button 
                className="btn btn-primary fw-bold py-2 px-4 flex-grow-1" 
                onClick={handleSaveQuotation}
                disabled={submitting}
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
              >
                {submitting ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="fas fa-save me-1"></i>}
                {parentQuotationId ? 'Save Revision & Go Back' : 'Save & Go Back'}
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
