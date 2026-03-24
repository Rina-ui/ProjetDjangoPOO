import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createBien, fetchCategories, fetchTypesBien, type Categorie, type TypeBien } from "../services/biens";

type AddBienFormProps = {
    proprietaireId: number;
    onClose: () => void;
    onSuccess?: () => void;
};

const AddBienForm = ({ proprietaireId, onClose, onSuccess }: AddBienFormProps) => {
    const [categories, setCategories] = useState<Categorie[]>([]);
    const [typesBien, setTypesBien] = useState<TypeBien[]>([]);
    const [loadingLists, setLoadingLists] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const [categorie, setCategorie] = useState<number>(0);
    const [typeBien, setTypeBien] = useState<number>(0);
    const [adresse, setAdresse] = useState("");
    const [description, setDescription] = useState("");
    const [equipementsInput, setEquipementsInput] = useState("");
    const [photosFiles, setPhotosFiles] = useState<File[]>([]);
    const [loyerHc, setLoyerHc] = useState("");
    const [charges, setCharges] = useState("");
    const [statut, setStatut] = useState<"VACANT" | "LOUE" | "EN_TRAVAUX">("VACANT");

    useEffect(() => {
        const loadData = async () => {
            try {
                const [cats, types] = await Promise.all([fetchCategories(), fetchTypesBien()]);
                setCategories(cats);
                setTypesBien(types);

                if (cats.length > 0) {
                    setCategorie(cats[0].id);
                }
            } catch (error) {
                setErrorMsg("Impossible de charger categories/types de bien.");
            } finally {
                setLoadingLists(false);
            }
        };

        void loadData();
    }, []);

    const filteredTypes = useMemo(
        () => typesBien.filter((item) => item.categorie === categorie),
        [typesBien, categorie]
    );

    useEffect(() => {
        if (filteredTypes.length === 0) {
            setTypeBien(0);
            return;
        }

        if (!filteredTypes.some((item) => item.id === typeBien)) {
            setTypeBien(filteredTypes[0].id);
        }
    }, [filteredTypes, typeBien]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        if (!categorie || !typeBien || !adresse || !description || !loyerHc || !charges) {
            setErrorMsg("Veuillez remplir tous les champs obligatoires.");
            return;
        }

        setSubmitting(true);

        try {
            const equipements = equipementsInput
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);

            const payload = {
                proprietaire: proprietaireId,
                categorie,
                type_bien: typeBien,
                adresse,
                description,
                photos: photosFiles,
                equipements,
                loyer_hc: Number(loyerHc),
                charges: Number(charges),
                statut,
            };

            console.log("[POST /api/biens/] payload:", payload);
            await createBien(payload);
            setSuccessMsg("Bien ajoute avec succes.");
            onSuccess?.();
        } catch (error: any) {
            const data = error?.response?.data;
            const backendMsg =
                data?.detail ||
                data?.adresse?.[0] ||
                data?.description?.[0] ||
                data?.type_bien?.[0] ||
                data?.categorie?.[0] ||
                "Echec de creation du bien.";
            setErrorMsg(String(backendMsg));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="card add-bien-card">
            <div className="card-hd add-bien-header">
                <span className="card-title">Ajouter un bien</span>
                <button className="btn-ghost" onClick={onClose} type="button">Fermer</button>
            </div>

            {loadingLists && <p className="add-bien-loading">Chargement des listes...</p>}
            {errorMsg && <p className="error-msg">{errorMsg}</p>}
            {successMsg && <p className="add-bien-success">{successMsg}</p>}

            <form className="add-bien-form" onSubmit={handleSubmit}>
                <div className="input-group">
                    <input type="number" value={proprietaireId} readOnly placeholder=" " />
                    <label>Proprietaire</label>
                </div>

                <div className="input-group">
                    <select
                        value={categorie || ""}
                        onChange={(event) => setCategorie(Number(event.target.value))}
                        disabled={loadingLists}
                        className="add-bien-select"
                    >
                        {categories.map((item) => (
                            <option key={item.id} value={item.id}>{item.nom}</option>
                        ))}
                    </select>
                    <label>Categorie</label>
                </div>

                <div className="input-group">
                    <select
                        value={typeBien || ""}
                        onChange={(event) => setTypeBien(Number(event.target.value))}
                        disabled={loadingLists || filteredTypes.length === 0}
                        className="add-bien-select"
                    >
                        {filteredTypes.map((item) => (
                            <option key={item.id} value={item.id}>{item.nom}</option>
                        ))}
                    </select>
                    <label>Type de bien</label>
                </div>

                <div className="input-group">
                    <select
                        value={statut}
                        onChange={(event) => setStatut(event.target.value as "VACANT" | "LOUE" | "EN_TRAVAUX")}
                        className="add-bien-select"
                    >
                        <option value="VACANT">VACANT</option>
                        <option value="LOUE">LOUE</option>
                        <option value="EN_TRAVAUX">EN_TRAVAUX</option>
                    </select>
                    <label>Statut</label>
                </div>

                <div className="input-group add-bien-full">
                    <input type="text" value={adresse} onChange={(event) => setAdresse(event.target.value)} placeholder=" " />
                    <label>Adresse</label>
                </div>

                <div className="input-group add-bien-full">
                    <input type="text" value={description} onChange={(event) => setDescription(event.target.value)} placeholder=" " />
                    <label>Description</label>
                </div>

                <div className="input-group add-bien-full">
                    <input
                        type="text"
                        value={equipementsInput}
                        onChange={(event) => setEquipementsInput(event.target.value)}
                        placeholder=" "
                    />
                    <label>Equipements (separes par virgule)</label>
                </div>

                <div className="input-group add-bien-full">
                    <input
                        className="add-bien-file-input"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(event) => {
                            const files = Array.from(event.target.files || []);
                            setPhotosFiles(files);
                        }}
                    />
                    <label>Photos depuis votre PC (optionnel)</label>
                </div>

                {photosFiles.length > 0 && (
                    <div className="add-bien-file-list">
                        {photosFiles.map((file) => file.name).join(", ")}
                    </div>
                )}

                <div className="input-group">
                    <input type="number" value={loyerHc} onChange={(event) => setLoyerHc(event.target.value)} placeholder=" " min={0} />
                    <label>Loyer HC</label>
                </div>

                <div className="input-group">
                    <input type="number" value={charges} onChange={(event) => setCharges(event.target.value)} placeholder=" " min={0} />
                    <label>Charges</label>
                </div>

                <div className="add-bien-actions">
                    <button className="btn-ghost" type="button" onClick={onClose}>Annuler</button>
                    <button className="dl-add-btn" type="submit" disabled={submitting || loadingLists}>
                        {submitting ? "Envoi..." : "Enregistrer le bien"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddBienForm;


