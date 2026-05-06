type GeneratedProps = {
  id: number;
  title: string;
  description: string;
  price: number;
};

export default function Generated(props: GeneratedProps) {
  return (
    <div className="product-card">
      <h2>{props.title}</h2>
      <p>{props.description}</p>
      <p>Price: ${props.price.toFixed(2)}</p>
    </div>
  );
}