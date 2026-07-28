"use client";

import { motion } from "framer-motion";
import Step from "./Step";

function HowItWorks() {
  return (
    <>
      <motion.div
        className=" w-full h-auto lg:[height:1500px] font-bnt py-10 md:p-10 border-b-2 border-chgrey"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.h2
          className="text-5xl sm:text-5xl lg:text-7xl text-center"
          initial={{ opacity: 0, y: -100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          HOW IT WORKS?
        </motion.h2>

        {/* Desktop Layout */}
        <div className="hidden lg:flex w-full h-auto pt-10 flex-row">
          <div className="w-1/2 [height:160vh] flex justify-end border-r-4 border-dashed border-gray-600">
            <motion.div
              className="w-1/3 h-1 bg-gray-600 mt-36 absolute"
              initial={{ opacity: 0, x: -200 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
            >
              <div className="[width:480px] h-56 border-4 p-6 bg-beige rounded-3xl relative right-32 bottom-24">
                <Step
                  img="/images/one.png"
                  title="Sign Up or Browse"
                  description="Create an account or browse our community to discover hobbies that inspire you."
                />
              </div>
            </motion.div>

            <motion.div
              className="w-1/3 h-1 bg-gray-600 [margin-top:750px] absolute"
              initial={{ opacity: 0, x: -200 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
            >
              <div className="[width:480px] h-56 border-4 p-6 bg-beige rounded-3xl relative right-32 bottom-24">
                <Step
                  img="/images/three.png"
                  title="Engage with the Community"
                  description="Join groups, chat with members, and participate in hobby-specific events or challenges."
                />
              </div>
            </motion.div>
          </div>

          <div className="w-1/2 [height:170vh] flex justify-start">
            <motion.div
              className="w-1/5 h-1 bg-gray-600 [margin-top:450px] absolute"
              initial={{ opacity: 0, x: 200 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
            >
              <div className="[width:480px] h-60 border-4 p-6 bg-somig rounded-3xl relative bottom-24 left-40">
                <Step
                  img="/images/two.png"
                  title="Customize Your Interests"
                  description="Select your hobbies to receive personalized recommendations and updates tailored to your passions."
                />
              </div>
            </motion.div>

            <motion.div
              className="w-1/5 h-1 bg-gray-600 [margin-top:1050px] absolute"
              initial={{ opacity: 0, x: 200 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
            >
              <div className="[width:480px] h-56 border-4 p-6 bg-somig rounded-3xl relative bottom-24 left-40">
                <Step
                  img="/images/four.png"
                  title="Share Your Journey"
                  description="Post photos, achievements, or tips to inspire others and showcase your growth."
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex lg:hidden flex-col items-center space-y-10 pt-10">
          <motion.div
            className="w-full max-w-[480px]"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="h-auto border-4 p-6 bg-beige rounded-3xl">
              <Step
                img="/images/one.png"
                title="Sign Up or Browse"
                description="Create an account or browse our community to discover hobbies that inspire you."
              />
            </div>
          </motion.div>

          <motion.div
            className="w-full max-w-[480px]"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="h-auto border-4 p-6 bg-somig rounded-3xl">
              <Step
                img="/images/two.png"
                title="Customize Your Interests"
                description="Select your hobbies to receive personalized recommendations and updates tailored to your passions."
              />
            </div>
          </motion.div>

          <motion.div
            className="w-full max-w-[480px]"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="h-auto border-4 p-6 bg-beige rounded-3xl">
              <Step
                img="/images/three.png"
                title="Engage with the Community"
                description="Join groups, chat with members, and participate in hobby-specific events or challenges."
              />
            </div>
          </motion.div>

          <motion.div
            className="w-full max-w-[480px]"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="h-auto border-4 p-6 bg-somig rounded-3xl">
              <Step
                img="/images/four.png"
                title="Share Your Journey"
                description="Post photos, achievements, or tips to inspire others and showcase your growth."
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}

export default HowItWorks;
