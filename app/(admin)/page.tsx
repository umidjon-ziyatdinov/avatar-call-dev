
"use client";
import React, { useState } from 'react';

import AdminScreen from './components/AdminScreen';







export default function HomePage() {


  

  return (
    <>
      <div className="h-full bg-background p-4 w-full max-w-full">
        <div defaultValue="chats" className="w-full max-w-3xl mx-auto">
        
          

  
              <AdminScreen  />
     
        </div>
      </div>
    
    </>
  );
}