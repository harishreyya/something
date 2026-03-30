import AddFriendButton from "./AddFriendButton";

export default function UserCard({ user }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition">
      
      <div className="flex items-center gap-3">
        <img
          src={user.image}
          className="w-12 h-12 rounded-full object-cover"
        />

        <div>
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <AddFriendButton userId={user.id} status={user.status} />
    </div>
  );
}