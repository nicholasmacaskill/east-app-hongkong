interface NewsCardProps {
  title: string;
  content: string;
}

export default function NewsCard({ title, content }: NewsCardProps) {
  return (
    <div className="news-card">
      <h3>{title}</h3>
      <p>{content}</p>
    </div>
  );
}