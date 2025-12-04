"use client";

import { useParams } from "next/navigation";
import { EditUserPage } from "../../src/components/users";

export default function EditCustomerPage() {
  const params = useParams();
  const userId = Number(params.id);

  return <EditUserPage userType="customer" userId={userId} />;
}
