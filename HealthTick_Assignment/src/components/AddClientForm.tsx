import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { v4 as uuidv4 } from 'uuid';

const AddClientForm = ({ setIsAddClientOpen }: any) => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const saveData = async () => {
        try {

            const response = await fetch(`${BACKEND_URL}addClient`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: uuidv4(), name, phone }),
            });
            const data = await response.json();
            console.log(data);
            setName('');
            setPhone('');
            toast.success('Client added successfully');
            setTimeout(() => {
                setIsAddClientOpen(false);
            }, 1000);
        } catch (error) {
            console.log(error);
        }
    }
    return (
        <div className="absolute w-screen h-screen bg-black/70 flex justify-center items-center">
            <Toaster
                position="top-center"
                reverseOrder={false}
            />
            <div className="text-black border bg-white w-1/3 h-1/2 z-50 rounded-2xl">
                <div className="flex items-center justify-between">

                    <div className="text-2xl font-semibold m-4">
                        Add Client
                    </div>
                    <div onClick={() => setIsAddClientOpen(false)} className="font-medium cursor-pointer mr-4 text-2xl">
                        X
                    </div>
                </div>
                <div className="p-4">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        saveData()
                    }}>
                        <div className="flex flex-col">
                            <label htmlFor="name">Name</label>
                            <input value={name} onChange={(e) => setName(e.target.value)} type="text" name="name" id="name" className="border rounded-md p-2" />
                        </div>
                        <div className="flex flex-col mt-4">
                            <label htmlFor="phone">Phone</label>
                            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="number" name="phone" id="phone" className="border rounded-md p-2" />
                        </div>
                        <button type="submit" className="bg-green-500 hover:bg-green-700 text-black font-bold py-2 px-4 rounded-full w-full mt-12 cursor-pointer">Save</button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default AddClientForm
