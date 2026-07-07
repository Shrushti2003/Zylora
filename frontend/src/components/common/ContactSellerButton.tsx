import { MessageCircle } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAuthErrorMessage, openSellerConversation, type SellerConversationPayload } from "../../services/auth.service";
import type { RootState } from "../../store/store";
import type { ProfileIdentity } from "../../utils/profile";
import { getDisplayName, getProfileIdentifier, getProfilePhoto } from "../../utils/profile";

type ContactSellerButtonProps = {
  seller: ProfileIdentity;
  listingId?: string;
  listingTitle?: string;
  sellerPhone?: string;
  className?: string;
  children?: ReactNode;
  onError?: (message: string) => void;
};

export function ContactSellerButton({
  seller,
  listingId,
  listingTitle,
  sellerPhone,
  className,
  children = "Contact",
  onError
}: ContactSellerButtonProps) {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [isOpening, setIsOpening] = useState(false);

  async function handleContact() {
    if (!user) {
      navigate("/login");
      return;
    }

    setIsOpening(true);
    try {
      const payload: SellerConversationPayload = {
        sellerId: seller.userId || seller.id || getProfileIdentifier(seller),
        sellerUserId: seller.userId,
        sellerSlug: seller.slug,
        sellerName: getDisplayName(seller),
        sellerPhotoUrl: getProfilePhoto(seller),
        sellerStatus: seller.verificationStatus === "Verified" || seller.isVerified ? "Verified seller" : "Securely connected",
        sellerPhone,
        listingId,
        listingTitle
      };
      const data = await openSellerConversation(payload);
      navigate(`/messages?conversation=${encodeURIComponent(data.conversationId)}`);
    } catch (error) {
      onError?.(getAuthErrorMessage(error, "Could not open this conversation. Please try again."));
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <button type="button" className={className} onClick={handleContact} disabled={isOpening}>
      <MessageCircle className="h-4 w-4" />
      {isOpening ? "Opening" : children}
    </button>
  );
}
