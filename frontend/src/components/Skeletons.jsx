import React from 'react';

// Shimmer gradient animation class helper
const shimmerClass = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

export const CardSkeleton = () => (
  <div className={`glass-panel p-6 w-full ${shimmerClass}`}>
    <div className="h-4 bg-gray-800 rounded w-1/3 mb-4" />
    <div className="h-8 bg-gray-800 rounded w-1/2 mb-2" />
    <div className="h-3 bg-gray-800 rounded w-3/4" />
  </div>
);

export const FormSkeleton = () => (
  <div className={`glass-panel p-6 w-full flex flex-col gap-4 ${shimmerClass}`}>
    <div className="h-6 bg-gray-800 rounded w-1/3 mb-4" />
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex flex-col gap-2">
        <div className="h-3 bg-gray-800 rounded w-1/4" />
        <div className="h-10 bg-gray-800 rounded w-full" />
      </div>
    ))}
  </div>
);

export const TableSkeleton = () => (
  <div className={`w-full flex flex-col gap-4 ${shimmerClass}`}>
    <div className="h-8 bg-gray-800 rounded w-1/4 mb-2" />
    <div className="w-full flex flex-col gap-2">
      <div className="h-10 bg-gray-800/40 rounded w-full flex justify-between px-4 items-center">
        <div className="h-4 bg-gray-800 rounded w-20" />
        <div className="h-4 bg-gray-800 rounded w-28" />
        <div className="h-4 bg-gray-800 rounded w-16" />
        <div className="h-4 bg-gray-800 rounded w-24" />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 bg-gray-900/40 border border-gray-800/50 rounded w-full flex justify-between px-4 items-center">
          <div className="h-4 bg-gray-800 rounded w-24" />
          <div className="h-4 bg-gray-800 rounded w-20" />
          <div className="h-4 bg-gray-800 rounded w-12" />
          <div className="h-4 bg-gray-800 rounded w-32" />
        </div>
      ))}
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="w-full flex flex-col gap-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <TableSkeleton />
      </div>
      <FormSkeleton />
    </div>
  </div>
);
