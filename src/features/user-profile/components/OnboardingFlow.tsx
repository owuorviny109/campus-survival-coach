import { useState } from 'react';
import { useStudentProfile } from '../hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select } from '../../../components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { CampusType, LivingArrangement, FoodHabit, TransportPattern } from '../types';

export function OnboardingFlow() {
    const { createProfile } = useStudentProfile();
    const [step, setStep] = useState(1);
    const totalSteps = 4;

    // Form State
    const [name, setName] = useState('');
    const [campusType, setCampusType] = useState<CampusType>('town');
    const [livingArrangement, setLivingArrangement] = useState<LivingArrangement>('off-campus-shared');
    const [foodHabits, setFoodHabits] = useState<FoodHabit>('mostly-cook');
    const [transportPattern, setTransportPattern] = useState<TransportPattern>('walking');
    const [currentBalance, setCurrentBalance] = useState<number>(0);
    const [cheapestMeal, setCheapestMeal] = useState<number>(50); // Default 50 KSh

    const handleNext = () => {
        if (step < totalSteps) setStep(step + 1);
        else handleSubmit();
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = () => {
        try {
            console.log("Submitting Profile...");

            const profileData = {
                name: name || 'Student', // Fallback
                campusType,
                livingArrangement,
                foodHabits,
                transportPattern,
                currentBalance: Number(currentBalance) || 0,
                cheapestMealCost: Number(cheapestMeal) || 50
            };

            console.log("Data to create:", profileData);
            createProfile(profileData);
            console.log("Profile created successfully in LocalStorage");

            // Should trigger App re-render automatically via useLocalStorage event
        } catch (e) {
            console.error("Error creating profile:", e);
            alert("Error creating profile. Please check console.");
        }
    };

    // Step Content Logic
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">What should we call you?</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Alex"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="campus">Where is your campus located?</Label>
                            <Select
                                id="campus"
                                value={campusType}
                                onChange={(e) => setCampusType(e.target.value as CampusType)}
                            >
                                <option value="rural">Rural Area (e.g. Kakamega, Njoro)</option>
                                <option value="town">Town Center (e.g. Eldoret, Nakuru)</option>
                                <option value="city">Major City (e.g. Nairobi, Mombasa)</option>
                            </Select>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Current Living Situation</Label>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'on-campus', label: 'On Campus (Hostels)' },
                                    { id: 'off-campus-shared', label: 'Off Campus (Shared)' },
                                    { id: 'off-campus-alone', label: 'Off Campus (Alone)' },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setLivingArrangement(opt.id as LivingArrangement)}
                                        className={`p-3 rounded-lg border text-left transition-all ${livingArrangement === opt.id
                                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                            : 'border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Food & Transport Habits</Label>
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-xs text-slate-500 mb-1 block">How do you usually eat?</Label>
                                    <Select value={foodHabits} onChange={(e) => setFoodHabits(e.target.value as FoodHabit)}>
                                        <option value="mostly-cook">I mostly cook (cheaper)</option>
                                        <option value="mixed">Mixed (Cook & Buy)</option>
                                        <option value="mostly-buy">I mostly buy/eat out</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500 mb-1 block">How do you get to campus?</Label>
                                    <Select value={transportPattern} onChange={(e) => setTransportPattern(e.target.value as TransportPattern)}>
                                        <option value="walking">Walking</option>
                                        <option value="public-transport">Matatu / Bus</option>
                                        <option value="mixed">Mixed</option>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="balance">Current M-Pesa/Bank Balance (KSh)</Label>
                            <Input
                                id="balance"
                                type="number"
                                placeholder="0"
                                value={currentBalance}
                                onChange={(e) => setCurrentBalance(Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="meal">Cost of your cheapest typical meal (KSh)</Label>
                            <Input
                                id="meal"
                                type="number"
                                placeholder="50"
                                value={cheapestMeal}
                                onChange={(e) => setCheapestMeal(Number(e.target.value))}
                            />
                            <p className="text-xs text-slate-500">e.g. 2 chapatis + beans</p>
                        </div>
                    </div>
                )
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Setup Your Profile</CardTitle>
                    <CardDescription>Step {step} of {totalSteps}: {
                        step === 1 ? 'Basic Info' :
                            step === 2 ? 'Living Situation' :
                                step === 3 ? 'Lifestyle' : 'Finance'
                    }</CardDescription>
                </CardHeader>
                <CardContent>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ x: 10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -10, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={handleBack} disabled={step === 1}>
                        Back
                    </Button>
                    <Button onClick={handleNext}>
                        {step === totalSteps ? 'Finish Setup' : 'Next'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
