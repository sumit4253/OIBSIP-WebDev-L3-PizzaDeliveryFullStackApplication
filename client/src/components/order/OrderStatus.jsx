import { ORDER_STATUSES } from '../../utils/constants';
import { Check } from 'lucide-react';

const OrderStatus = ({ currentStatus }) => {
  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center justify-center p-6 bg-red-50 rounded-2xl border-2 border-red-200">
        <div className="text-center">
          <div className="text-4xl mb-2">❌</div>
          <p className="font-display font-bold text-red-700 text-lg">Order Cancelled</p>
          <p className="text-sm text-red-500 mt-1">This order has been cancelled</p>
        </div>
      </div>
    );
  }

  const steps = ORDER_STATUSES.filter((s) => s.value !== 'cancelled');
  const currentStep = steps.find((s) => s.value === currentStatus)?.step || 1;

  return (
    <div className="relative">
      {/* Progress bar */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 mx-8 z-0">
        <div
          className="h-full bg-orange-500 transition-all duration-700"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="relative z-10 flex justify-between">
        {steps.map((step) => {
          const done    = step.step < currentStep;
          const active  = step.step === currentStep;
          const pending = step.step > currentStep;

          return (
            <div key={step.value} className="flex flex-col items-center gap-2 flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-300 ${
                  done    ? 'bg-orange-500 border-orange-500 text-white'
                  : active ? 'bg-white border-orange-500 ring-4 ring-orange-100'
                  :          'bg-white border-gray-200'
                }`}
              >
                {done ? <Check size={18} className="text-white" /> : step.icon}
              </div>
              <div className="text-center">
                <p className={`text-xs font-semibold leading-tight text-center ${
                  active  ? 'text-orange-600'
                  : done  ? 'text-gray-600'
                  :          'text-gray-300'
                }`}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatus;