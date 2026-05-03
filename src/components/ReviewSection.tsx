import React, { useEffect, useState } from "react";
import { Star, ThumbsUp, Flag, MessageSquare, User, Image as ImageIcon } from "lucide-react";
import { useSelector } from "react-redux";
import { getReviews, addReview, addReplyToReview, voteReviewHelpful, flagReview } from "@/api";
import { Button } from "./ui/button";

const ReviewSection = ({ targetId, targetType }: { targetId: string; targetType: "HOTEL" | "FLIGHT" }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState("NEWEST");
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [photoUrl, setPhotoUrl] = useState("");
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const user = useSelector((state: any) => state.user.user);

  const fetchReviews = async () => {
    const data = await getReviews(targetId, targetType);
    if (data) setReviews(data);
  };

  useEffect(() => {
    if (targetId) fetchReviews();
  }, [targetId]);

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "HIGHEST") return b.rating - a.rating;
    if (sortBy === "HELPFUL") return b.helpfulVotes - a.helpfulVotes;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Please login to post a review.");
    if (!newReview.trim()) return;

    const reviewData = {
      targetId,
      targetType,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      rating: newRating,
      comment: newReview,
      photos: photoUrl ? [photoUrl] : [],
    };

    await addReview(reviewData);
    setNewReview("");
    setPhotoUrl("");
    setNewRating(5);
    fetchReviews();
  };

  const handleReply = async (reviewId: string) => {
    if (!user) return alert("Please login to reply.");
    if (!replyText.trim()) return;

    const replyData = {
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      comment: replyText,
    };

    await addReplyToReview(reviewId, replyData);
    setReplyText("");
    setActiveReplyId(null);
    fetchReviews();
  };

  const handleHelpful = async (reviewId: string) => {
    await voteReviewHelpful(reviewId);
    fetchReviews();
  };

  const handleFlag = async (reviewId: string) => {
    await flagReview(reviewId);
    alert("Review flagged for moderation.");
    fetchReviews();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold">Customer Reviews</h2>
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="border rounded-md px-3 py-1 text-sm outline-none cursor-pointer"
        >
          <option value="NEWEST">Newest First</option>
          <option value="HIGHEST">Highest Rated</option>
          <option value="HELPFUL">Most Helpful</option>
        </select>
      </div>

      {/* Write a Review Section */}
      <div className="mb-8 bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold mb-3">Write a Review</h3>
        <div className="flex items-center space-x-1 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-6 h-6 cursor-pointer ${star <= newRating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
              onClick={() => setNewRating(star)}
            />
          ))}
        </div>
        <textarea
          value={newReview}
          onChange={(e) => setNewReview(e.target.value)}
          placeholder="Share your experience..."
          className="w-full border rounded-lg p-3 outline-none focus:border-blue-500 mb-3"
          rows={3}
        />
        <div className="flex items-center space-x-3 mb-3">
          <ImageIcon className="w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Image URL (Optional)" 
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            className="flex-1 border rounded px-3 py-1.5 text-sm outline-none"
          />
        </div>
        <Button onClick={handleSubmitReview} className="bg-blue-600 text-white hover:bg-blue-700">Post Review</Button>
      </div>

      {/* Review List */}
      <div className="space-y-6">
        {sortedReviews.length === 0 ? (
          <p className="text-gray-500 italic">No reviews yet. Be the first to review!</p>
        ) : (
          sortedReviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                    {review.userName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{review.userName}</p>
                    <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-current" : "text-gray-300"}`} />
                  ))}
                </div>
              </div>

              <p className="text-gray-700 mt-3 mb-3">{review.comment}</p>
              
              {review.photos && review.photos.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {review.photos.map((photo: string, idx: number) => (
                    <img key={idx} src={photo} alt="Review attachment" className="w-24 h-24 object-cover rounded-lg border" />
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <button onClick={() => handleHelpful(review.id)} className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  <span>Helpful ({review.helpfulVotes})</span>
                </button>
                <button onClick={() => setActiveReplyId(activeReplyId === review.id ? null : review.id)} className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  <span>Reply</span>
                </button>
                <button onClick={() => handleFlag(review.id)} className="flex items-center space-x-1 hover:text-red-500 transition-colors ml-auto">
                  <Flag className="w-4 h-4" />
                  <span>Report</span>
                </button>
              </div>

              {/* Nested Replies */}
              {review.replies && review.replies.length > 0 && (
                <div className="ml-12 mt-4 space-y-4 bg-gray-50 p-4 rounded-lg">
                  {review.replies.map((reply: any) => (
                    <div key={reply.id} className="flex space-x-3">
                       <User className="w-6 h-6 text-gray-400 bg-white rounded-full p-1" />
                       <div>
                         <p className="text-sm font-semibold text-gray-800">{reply.userName} <span className="text-xs font-normal text-gray-500 ml-2">{new Date(reply.createdAt).toLocaleDateString()}</span></p>
                         <p className="text-sm text-gray-700 mt-1">{reply.comment}</p>
                       </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              {activeReplyId === review.id && (
                <div className="ml-12 mt-4 flex space-x-2">
                  <input 
                    type="text" 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..." 
                    className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                  <Button onClick={() => handleReply(review.id)} className="bg-gray-800 text-white hover:bg-gray-900">Post</Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection;