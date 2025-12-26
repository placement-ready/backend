import mongoose from "mongoose";

const Schema = mongoose.Schema;

interface IHistory extends mongoose.Document {
	userId: mongoose.Types.ObjectId;
	message: string;
	response: string;
	createdAt: Date;
	updatedAt: Date;
}

const HistorySchema = new Schema<IHistory>(
	{
		userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
		message: { type: String, required: true },
		response: { type: String, required: true },
	},
	{
		timestamps: true,
	}
);

const History = mongoose.model<IHistory>("History", HistorySchema);

export default History;
