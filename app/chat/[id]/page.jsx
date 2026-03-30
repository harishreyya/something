import ChatBox from "../../components/ChatBox";

export default async function ChatPage({ params }) {
  const { id } = await params; 

  return <ChatBox receiverId={id} />;
}