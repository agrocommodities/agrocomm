"use client";

import React from "react";

interface ModalProps {
  title: string;
  children: React.ReactNode;
  open: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Modal({ title, children, open = false, setIsOpen }: ModalProps) {
  return (
    <div>
      <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" className={`relative z-10 ${open ? "" : "hidden"}`}>
        <div aria-hidden="true" className="fixed inset-0 bg-black/85 transition-opacity"></div>
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-center sm:items-start">
                  <div className="w-full mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left border border-blue">
                    <h3 id="dialog-title" className="text-lg font-semibold text-gray-900">{title}</h3>
                    <div className="w-full flex justify-center border border-red mt-3">
                      {children}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button onClick={() => setIsOpen(false)} type="button" className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 sm:ml-3 sm:w-auto">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>




  );
}