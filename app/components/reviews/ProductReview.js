"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Pencil,
  Trash2,
  Send,
} from "lucide-react";

export default function ProductReviews({
  productId,
}) {
  const [reviews, setReviews] = useState([]);
  const [eligibility, setEligibility] = useState({
    loggedIn: false,
    hasPurchased: false,
    canReview: false,
    hasReviewed: false,
  });

  const [currentUserReview, setCurrentUserReview] =
    useState(null);

  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/reviews?productId=${productId}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!data.success) {
        setError(
          data.message || "Unable to load reviews."
        );
        return;
      }

      setReviews(data.reviews || []);
      setEligibility(data.eligibility || {});
      setCurrentUserReview(
        data.currentUserReview || null
      );
    } catch (err) {
      console.error(err);
      setError("Unable to load reviews.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId, fetchReviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!comment.trim()) {
      setError("Please write your review.");
      return;
    }

    try {
      setSubmitting(true);

      const url = editing
        ? `/api/reviews/${currentUserReview._id}`
        : "/api/reviews";

      const method = editing
        ? "PATCH"
        : "POST";

      const body = editing
        ? {
            comment,
          }
        : {
            productId,
            comment,
          };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(
          data.message ||
            "Unable to submit review."
        );
        return;
      }

      setComment("");
      setEditing(false);

      setMessage(data.message);

      await fetchReviews();
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    if (!currentUserReview) return;

    setComment(currentUserReview.comment);
    setEditing(true);
    setError("");
  };

  const handleDelete = async () => {
    if (!currentUserReview) return;

    const confirmed = window.confirm(
      "Delete your review?"
    );

    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/reviews/${currentUserReview._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(
          data.message ||
            "Unable to delete review."
        );
        return;
      }

      setComment("");
      setEditing(false);

      await fetchReviews();
    } catch (err) {
      console.error(err);
      setError("Unable to delete review.");
    }
  };

  return (
    <section className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Customer Reviews
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {reviews.length}{" "}
            {reviews.length === 1
              ? "review"
              : "reviews"}
          </p>
        </div>
      </div>

      {/* Review Input */}
      {eligibility.loggedIn &&
        (eligibility.canReview ||
          currentUserReview) && (
          <div className="mt-5">
            <form
              onSubmit={handleSubmit}
              className="flex items-start gap-3"
            >
              {/* Current user avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                U
              </div>

              <div className="flex-1">
                <div className="flex items-end gap-2 rounded-2xl bg-gray-100 px-4 py-2">
                  <textarea
                    rows={1}
                    value={comment}
                    onChange={(e) =>
                      setComment(e.target.value)
                    }
                    placeholder="Write your review"
                    className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400"
                  />

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      !comment.trim()
                    }
                    className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white transition hover:bg-black disabled:opacity-30"
                  >
                    <Send size={16} />
                  </button>
                </div>

                {editing && (
                  <div className="mt-2 flex items-center gap-3">
                    <p className="text-xs text-gray-500">
                      Editing your review
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setComment("");
                      }}
                      className="text-xs font-medium text-red-500"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}

      {/* Not logged in */}
      {!loading &&
        !eligibility.loggedIn && (
          <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
            Login to write a review.
          </div>
        )}

      {/* Testing mode / production purchase message */}
      {!loading &&
        eligibility.loggedIn &&
        !eligibility.hasPurchased &&
        !eligibility.canReview &&
        !currentUserReview && (
          <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-sm text-gray-500">
              Purchase this product to write a
              review.
            </p>
          </div>
        )}

      {message && (
        <p className="mt-4 text-sm text-emerald-600">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Reviews */}
      <div className="mt-6 space-y-5">
        {loading ? (
          <p className="text-sm text-gray-500">
            Loading reviews...
          </p>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl bg-gray-50 px-5 py-8 text-center">
            <p className="text-sm font-medium text-gray-700">
              No reviews yet
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Be the first to share your experience.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review._id}
              className="flex items-start gap-3"
            >
              {/* Profile */}
              {review.userId?.profileImage ? (
                <img
                  src={review.userId.profileImage}
                  alt={
                    review.userId.name ||
                    "Customer"
                  }
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                  {review.userId?.name
                    ?.charAt(0)
                    ?.toUpperCase() || "U"}
                </div>
              )}

              <div className="min-w-0 flex-1">
                {/* Facebook-style comment bubble */}
                <div className="inline-block max-w-full rounded-2xl bg-gray-100 px-4 py-2.5">
                  <p className="text-sm font-semibold text-gray-900">
                    {review.userId?.name ||
                      "Customer"}
                  </p>

                  <p className="mt-0.5 whitespace-pre-line break-words text-sm leading-5 text-gray-700">
                    {review.comment}
                  </p>
                </div>

                <div className="mt-1.5 flex items-center gap-3 pl-2">
                  <span className="text-xs text-gray-400">
                    {new Date(
                      review.createdAt
                    ).toLocaleDateString()}
                  </span>

                  {currentUserReview?._id ===
                    review._id && (
                    <>
                      <button
                        type="button"
                        onClick={handleEdit}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900"
                      >
                        <Pencil size={12} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={handleDelete}
                        className="flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}