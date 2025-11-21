"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
      null
    );

    useEffect(() => {
      if (typeof window !== "undefined") {
        const user = localStorage.getItem("user");

        if (!user) {
          setIsAuthenticated(false);
          router.replace("/login");
          return;
        }

        try {
          JSON.parse(user);
          setIsAuthenticated(true);
        } catch (error) {
          localStorage.removeItem("user");
          setIsAuthenticated(false);
          router.replace("/login");
        }
      }
    }, [router]);

    if (isAuthenticated === null) {
      return (
        <div className='flex items-center justify-center h-screen text-lg'>
          Loading...
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
