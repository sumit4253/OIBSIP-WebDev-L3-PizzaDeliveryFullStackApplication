import { useState, useEffect } from 'react';
import pizzaService from '../../services/pizzaService';
import PizzaCard from '../../components/pizza/PizzaCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PizzaList = () => {
  const [pizzas,  setPizzas]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pizzaService.getAllPizzas({ available: true })
      .then((res) => setPizzas(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" text="Loading menu..." /></div>;

  return (
    <div className="container-custom py-10">
      <h1 className="page-title mb-2">Our Menu</h1>
      <p className="subtitle mb-8">Fresh pizzas made with love</p>
      {pizzas.length === 0 ? (
        <div className="empty-state">
          <p className="text-6xl mb-4">🍕</p>
          <p className="empty-state-title">No pizzas available yet</p>
          <p className="empty-state-text">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pizzas.map((pizza) => <PizzaCard key={pizza._id} pizza={pizza} />)}
        </div>
      )}
    </div>
  );
};
export default PizzaList;