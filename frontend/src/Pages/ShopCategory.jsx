import React, { useEffect, useState } from "react";
import "./CSS/ShopCategory.css";
import Item from "../Components/Item/Item";
import axios from "axios";

const ShopCategory = (props) => {
  const [products, setProducts] = useState([]);
  const [sortOrder, setSortOrder] = useState("asc");
  const [visibleCount, setVisibleCount] = useState(8); // ← 👈 on affiche d'abord 8 produits

  useEffect(() => {
    const fetchSortedProducts = async () => {
      try {
        const res = await axios.get(
          `http://localhost:4000/products/${props.category}?sort=${sortOrder}`
        );
        setProducts(res.data);
        setVisibleCount(8); // 👈 reset visible count à chaque tri ou changement de catégorie
      } catch (err) {
        console.error("Erreur lors de la récupération des produits :", err.message);
      }
    };

    fetchSortedProducts();
  }, [props.category, sortOrder]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 8); // 👈 ajouter 8 de plus à chaque clic
  };

  return (
    <div className="shop-category">
      <img className="shopCategory-banner" src={props.banner} alt="" />

      <div className="shopCategory-indexSort">
        <p>Sort by</p>
        <div className="shopCategory-short">
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="asc">Price: Low to High</option>
            <option value="desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="shopCategory-products">
        {products.slice(0, visibleCount).map((item, i) => (
          <Item
            key={i}
            id={item.id}
            name={item.name}
            image={item.image}
            new_price={item.new_price}
            old_price={item.old_price}
          />
        ))}
      </div>

      {visibleCount < products.length && (
        <div className="shopCategory-loadMore" onClick={handleLoadMore}>
          explore more
        </div>
      )}
    </div>
  );
};

export default ShopCategory;
