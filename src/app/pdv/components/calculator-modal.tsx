import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CalculatorModal({ isOpen, onClose }: CalculatorModalProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const formatDisplay = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const toggleSign = () => {
    const currentValue = parseFloat(display);
    const newValue = currentValue * -1;
    setDisplay(newValue.toString());
  };

  const percentage = () => {
    const currentValue = parseFloat(display);
    const newValue = currentValue / 100;
    setDisplay(newValue.toString());
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      let newValue = currentValue;

      if (operation === '+') newValue = currentValue + inputValue;
      else if (operation === '-') newValue = currentValue - inputValue;
      else if (operation === '×') newValue = currentValue * inputValue;
      else if (operation === '÷') newValue = currentValue / inputValue;

      setDisplay(newValue.toString());
      setPreviousValue(newValue);
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  };

  const calculate = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const currentValue = previousValue;
      let newValue = currentValue;

      if (operation === '+') newValue = currentValue + inputValue;
      else if (operation === '-') newValue = currentValue - inputValue;
      else if (operation === '×') newValue = currentValue * inputValue;
      else if (operation === '÷') newValue = currentValue / inputValue;

      setDisplay(newValue.toString());
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const CalculatorButton = ({ 
    onClick, 
    className = '', 
    children, 
    ...props 
  }: any) => (
    <Button
      onClick={onClick}
      className={`h-16 text-lg font-semibold ${className}`}
      {...props}
    >
      {children}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold"></DialogTitle>
        </DialogHeader>
        
        <CardContent className="p-0">
          <Card className="border-0 shadow-none">
            <CardContent className="p-4 space-y-4">
              {/* Display */}
              <div className="bg-black text-white text-right p-4 rounded-lg">
                <div className="text-3xl font-mono">
                  {formatDisplay(display)}
                </div>
              </div>

              {/* Buttons Grid */}
              <div className="grid grid-cols-4 gap-2">
                {/* First Row */}
                <CalculatorButton
                  onClick={clear}
                  className="col-span-2 bg-gray-200 hover:bg-gray-300"
                >
                  AC
                </CalculatorButton>
                <CalculatorButton
                  onClick={toggleSign}
                  className="bg-gray-200 hover:bg-gray-300"
                >
                  +/-
                </CalculatorButton>
                <CalculatorButton
                  onClick={percentage}
                  className="bg-gray-200 hover:bg-gray-300"
                >
                  %
                </CalculatorButton>

                {/* Second Row */}
                <CalculatorButton onClick={() => inputNumber('7')}>
                  7
                </CalculatorButton>
                <CalculatorButton onClick={() => inputNumber('8')}>
                  8
                </CalculatorButton>
                <CalculatorButton onClick={() => inputNumber('9')}>
                  9
                </CalculatorButton>
                <CalculatorButton
                  onClick={() => performOperation('÷')}
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  ÷
                </CalculatorButton>

                {/* Third Row */}
                <CalculatorButton onClick={() => inputNumber('4')}>
                  4
                </CalculatorButton>
                <CalculatorButton onClick={() => inputNumber('5')}>
                  5
                </CalculatorButton>
                <CalculatorButton onClick={() => inputNumber('6')}>
                  6
                </CalculatorButton>
                <CalculatorButton
                  onClick={() => performOperation('×')}
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  ×
                </CalculatorButton>

                {/* Fourth Row */}
                <CalculatorButton onClick={() => inputNumber('1')}>
                  1
                </CalculatorButton>
                <CalculatorButton onClick={() => inputNumber('2')}>
                  2
                </CalculatorButton>
                <CalculatorButton onClick={() => inputNumber('3')}>
                  3
                </CalculatorButton>
                <CalculatorButton
                  onClick={() => performOperation('-')}
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  -
                </CalculatorButton>

                {/* Fifth Row */}
                <CalculatorButton
                  onClick={() => inputNumber('0')}
                  className="col-span-2"
                >
                  0
                </CalculatorButton>
                <CalculatorButton onClick={inputDecimal}>
                  ,
                </CalculatorButton>
                <CalculatorButton
                  onClick={() => performOperation('+')}
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  +
                </CalculatorButton>

                {/* Final Row */}
                <CalculatorButton
                  onClick={calculate}
                  className="col-span-4 bg-green-500 text-white hover:bg-green-600"
                >
                  =
                </CalculatorButton>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </DialogContent>
    </Dialog>
  );
}