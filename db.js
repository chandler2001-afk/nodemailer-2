const {PrismaClient}=require("@prisma/client");
const prisma=new PrismaClient();

const getAllMails = async () => {
    try {
        const emails = await prisma.Emails.findMany();
        return emails;
    } catch (error) {
        console.error("Error fetching emails:", error);
        throw error;
    }
};
const addEmail=async(req,res)=>{
    try {
        const {email}=req.body;
        const new_mail=await prisma.Emails.create({
            data:{
                email:email
            }
        })
        res.status(200).send({new_mail});
    } catch (error) {
        console.error("Error adding email:", error);
        throw error;
    }
}
module.exports={getAllMails,addEmail}