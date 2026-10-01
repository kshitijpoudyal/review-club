import { Transaction } from '../types/Transaction';

export const parsePayPalCSV = (csvContent: string): Transaction[] => {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header and one data row');
  }

  // Parse header to get column mapping
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase());
  
  // Create column index mapping
  const columnMap = {
    date: headers.findIndex(h => h === 'date'),
    time: headers.findIndex(h => h === 'time'),
    name: headers.findIndex(h => h === 'name'),
    type: headers.findIndex(h => h === 'type'),
    amount: headers.findIndex(h => h === 'amount'),
    fees: headers.findIndex(h => h === 'fees'),
    total: headers.findIndex(h => h === 'total'),
    transactionId: headers.findIndex(h => h === 'transaction id' || h === 'transactionid')
  };

  // Validate required columns are present
  const missingColumns = Object.entries(columnMap)
    .filter(([_, index]) => index === -1)
    .map(([key]) => key);

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  // Remove header
  const dataLines = lines.slice(1);

  const transactions: Transaction[] = [];

  dataLines.forEach((line, index) => {
    try {
      // Parse CSV line considering quoted fields
      const fields = parseCSVLine(line);
      
      if (fields.length < Math.max(...Object.values(columnMap)) + 1) {
        console.warn(`Skipping line ${index + 2}: insufficient fields`);
        return;
      }

      // Extract data using column mapping
      const date = fields[columnMap.date]?.trim() || '';
      const time = fields[columnMap.time]?.trim() || '';
      const name = fields[columnMap.name]?.trim() || '';
      const type = fields[columnMap.type]?.trim() || '';
      const fees = fields[columnMap.fees]?.trim() || '0';
      const total = fields[columnMap.total]?.trim() || '0';
      const transactionId = fields[columnMap.transactionId]?.trim() || '';

      // Skip empty or invalid transaction IDs
      if (!transactionId || transactionId === '') {
        console.warn(`Skipping line ${index + 2}: missing transaction ID`);
        return;
      }

      // Skip "User Initiated Withdrawal" transactions
      if (type === 'User Initiated Withdrawal') {
        console.log(`Skipping line ${index + 2}: User Initiated Withdrawal transaction`);
        return;
      }

      // Parse fees and total values
      const feesValue = parseFloat(fees) || 0;
      const totalValue = parseFloat(total) || 0;
      
      // Auto-calculate total and amount when fees change as the paypal csv export does not provide amount before fees
      // If fees < 0: Amount = positive(fees) + net received (total)
      // Else: Amount = net received (total)
      let calculatedAmount: number;
      if (feesValue < 0) {
        calculatedAmount = Math.abs(feesValue) + totalValue;
      } else {
        calculatedAmount = totalValue;
      }

      const transaction: Transaction = {
        date,
        time,
        timeZone: 'PST', // Default timezone since it's not in the simplified format
        name,
        type,
        currency: 'USD', // Default currency since it's not in the simplified format
        amount: calculatedAmount,
        fees: feesValue,
        total: totalValue,
        transactionId,
        paymentMethod: 'PayPal', // this parser only ever handles PayPal's CSV export format
      };

      transactions.push(transaction);
    } catch (error) {
      console.error(`Error parsing line ${index + 2}:`, error);
    }
  });

  return transactions;
};

// Helper function to parse CSV line with quoted fields
const parseCSVLine = (line: string): string[] => {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      fields.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  fields.push(current);

  return fields;
};

export const validatePayPalCSV = (csvContent: string): { isValid: boolean; error?: string } => {
  try {
    const lines = csvContent.trim().split('\n');
    
    if (lines.length < 2) {
      return { isValid: false, error: 'CSV file must contain at least a header and one data row' };
    }

    // Parse header and check for required columns
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase());
    
    const requiredColumns = ['date', 'time', 'name', 'type', 'amount', 'fees', 'total', 'transaction id'];
    
    const missingColumns = requiredColumns.filter(col => 
      !headers.some(header => header === col || (col === 'transaction id' && header === 'transactionid'))
    );
    
    if (missingColumns.length > 0) {
      return { 
        isValid: false, 
        error: `Missing required columns: ${missingColumns.join(', ')}` 
      };
    }

    // Try to parse first data line
    const firstDataLine = lines[1];
    const fields = parseCSVLine(firstDataLine);
    
    if (fields.length < 8) {
      return { 
        isValid: false, 
        error: 'Data rows must contain at least 8 fields (Date, Time, Name, Type, Amount, Fees, Total, Transaction ID)' 
      };
    }

    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Unknown validation error' 
    };
  }
};
